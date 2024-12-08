import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import * as url from 'url';
import * as glob from 'glob';
import achiver from 'archiver';

const __dirname = url.fileURLToPath(new URL('../', import.meta.url));
const ScriptJson = [
	"styleFileList",
	"scriptFileList_earlyload",
	"scriptFileList_inject_early",
	"scriptFileList_preload",
	"scriptFileList",
	"tweeFileList",
	"imgFileList",
	"additionFile"
]

interface PackRule {
    VersionJs: {
        file: string;
        regex: string;
    };
    ScriptFolder: Record<string, string[]>;
}

interface filedata {
    module: string; // module name
    realPath: string;
    path: string;
}

class ProjectPackager {
    private projectDir: string;
    private outputDir: string;
    private packRule: PackRule;
    private bootTemplate: Record<string, any>;
    private gatheredFiles: filedata[];
    private moduleorder: any;

    constructor(projectDir: string, outputDir: string, packRule: PackRule, bootTemplate: Record<string, any>) {
        /**
         * Initialize the packager.
         *
         * @param projectDir - Path to the root project directory containing submodules.
         * @param outputDir - Path to the directory where the zip file will be saved.
         * @param packRule - Packing rules.
         * @param bootTemplate - Template for boot.json.
         */
        this.projectDir = projectDir;
        this.outputDir = outputDir;
        this.packRule = packRule;
        this.bootTemplate = bootTemplate;
        this.moduleorder = null;
        this.gatheredFiles = [];
    }

    private updateVersion(): { version: string, buildnumber: number, date: string } {
        const versionFile = path.join(this.projectDir, this.packRule.VersionJs.file);
        const versionRegex = new RegExp(this.packRule.VersionJs.regex, 'm');
        const version = this.bootTemplate.version;

        const buildRegex = /const builds = (\d+)/m;
        const buildnumber = this.updateBuildNumber();

        // date example: 2021.09.01
        const dateRegex = /const lastUpdate = '(\d{4}\.\d{2}\.\d{2})'/m;
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');

        if (fs.existsSync(versionFile)) {
            const content = fs.readFileSync(versionFile, 'utf-8');
            let updatedContent = content.replace(versionRegex, `$1 '${version}'`).replace(buildRegex, `const builds = ${buildnumber}`);
            updatedContent = updatedContent.replace(dateRegex, `const lastUpdate = '${date}'`);

            fs.writeFileSync(versionFile, updatedContent, 'utf-8');
        } else {
            throw new Error(`Version file not found: ${versionFile}`);
        }

        return {
            version,
            buildnumber,
            date
        }
    }

    private updateBuildNumber(): number {
        const buildfile = path.join(this.projectDir, "buildnumber");
        let buildnumber = 0;
        if (fs.existsSync(buildfile)) {
            buildnumber = parseInt(fs.readFileSync(buildfile, "utf8"));
        }

        buildnumber++;
        fs.writeFileSync(buildfile, buildnumber.toString());

        return buildnumber;
    }

    private getModuleFolders(): string[] {
        return fs.readdirSync(this.projectDir).filter((folder) => {
            const modulePath = path.join(this.projectDir, folder, 'module.json');
            return fs.existsSync(modulePath) && fs.statSync(path.join(this.projectDir, folder)).isDirectory();
        });
    }

    private getModuleJson(module: string): { [key: string]: any } {
        const modulePath = path.join(this.projectDir, module, 'module.json');
        if (!fs.existsSync(modulePath)) {
            throw new Error(`Module file not found: ${modulePath}`);
        }
        return JSON.parse(fs.readFileSync(modulePath, 'utf-8'));
    }

    private addModuleFiles(archive: archiver.Archiver, moduleFolders: string[]): void {
        const modulejson = {};

        moduleFolders.forEach(module => {
            const data = this.getModuleJson(module);
            modulejson[module] = data;
        });

        this.moduleorder = modulejson;
        console.log("modulejson", modulejson);
        
        // sort the module folders by order
        const folders = moduleFolders.sort((a, b) => {
            const aOrder = modulejson[a].order || 0;
            const bOrder = modulejson[b].order || 0;
            return aOrder - bOrder;
        });

        console.log("folders", folders);

        let i = 0;

        for (const module of folders) {
            const modulePath = path.join(this.projectDir, module);
            // gather all files from the module folder include subfolders
            const files = glob.sync('**/*', { cwd: modulePath, nodir: true });
            //console.log(`Adding files from module: ${module}`, files);
            for (const file of files) {
                if (file === 'module.json') continue;

                const filePath = path.join(modulePath, file);
                const result = {
                    module,
                    realPath: filePath,
                    path: file
                }
                //console.log(`Adding file: ${file}, path: ${filePath}, virtualPath: ${filename}`);
                archive.file(filePath, { name: file });
                this.gatheredFiles.push(result);
            }

            i++;
        }
    }

    private generateBootJson(gatheredFiles: filedata[]): Record<string, any> {
        const bootData = { ...this.bootTemplate };
        const folderfiles = {}

        // sort the gathered files by module order
        gatheredFiles = gatheredFiles.sort((a, b) => {
            const aOrder = this.moduleorder[a.module].order || 0;
            const bOrder = this.moduleorder[b.module].order || 0;
            return aOrder - bOrder;
        });
        
        //console.log("gatheredFiles", gatheredFiles);

        // Register module-related files
        for (const script of ScriptJson) {
            if (!this.packRule.ScriptFolder[script]) {
                continue;
            }

            console.log(`Processing type: ${script}, patterns:`, this.packRule.ScriptFolder[script]);
            if (!folderfiles[script]) {
                folderfiles[script] = [];
            }
            const _dir = this.projectDir;
            const patterns = this.packRule.ScriptFolder[script];

            let files:any[] = []

            gatheredFiles.forEach(file => {
                const modulePath = path.join(_dir, file.module).replace(/\\/gim, "/") + "/";
                const _path = glob.sync(patterns, { cwd: modulePath } );
                files.push(..._path.map((item) => item.replace(/\\/gim, "/")));
            });

            files = [...new Set(files)];
            //console.log(`Matched files for pattern: ${patterns}`, files);
            // sort the files by last file name if same length
            files.sort((a, b) => {
                
                let aOrder = a.split("/")
                let bOrder = b.split("/")
                if (aOrder.length == bOrder.length) {
                    aOrder = aOrder[aOrder.length - 1]
                    bOrder = bOrder[bOrder.length - 1]
                    return aOrder.localeCompare(bOrder);
                }
                return 0;
            });

            // if length is same, sort by first subfolder
            files.sort((a, b) => {
                if (a.length > 2 && b.length > 2) {
                    let aOrder = a.split("/")[1]
                    let bOrder = b.split("/")[1]
                    return aOrder.localeCompare(bOrder);
                }
                else {
                    return 0;
                }
            })

            // sort by length of path
            files.sort((a, b) => {
                return b.split("/").length - a.split("/").length;
            });

            // sort by first folder order
            files.sort((a, b) => {
                let aOrder = a.split("/")[0]
                let bOrder = b.split("/")[0]
                return aOrder.localeCompare(bOrder);
            });

            console.log(`Sorted files for ${script}:`, files);

            folderfiles[script].push(...files);
        }

        console.log("folderfiles", folderfiles);
        
        // Merge and remove duplicate
        for (const key of ScriptJson) {
            if (bootData[key]) {
                bootData[key] = [...new Set(folderfiles[key])];
            }
        }

        return bootData;
    }

    public async packageProject(): Promise<void> {
        /**
         * Package the project directory into a zip file with boot.json included.
         */
        // Update version in the designated file
        const versions = this.updateVersion();

        // Identify valid module folders
        const moduleFolders = this.getModuleFolders();

        console.log("gatheredFiles", this.gatheredFiles);
        console.log("moduleFolders", moduleFolders);

        // Define output zip file path
        const zipFilename = path.join(this.outputDir, `SimpleFramework ver${versions.version} build_${versions.buildnumber}.zip`);

        // Create zip file
        const output = fs.createWriteStream(zipFilename);
        const archive = achiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Project packaged successfully: ${zipFilename}`);
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // Add files from module folders
        this.addModuleFiles(archive, moduleFolders);

        // Generate boot.json content
        const bootData = this.generateBootJson(this.gatheredFiles)
        console.log("bootData", bootData);

        bootData.build = versions.buildnumber;
        bootData.lastUpdate = versions.date;

        // Add boot.json to the zip file
        const bootJsonPath = path.join(this.projectDir, "boot.json");
        fs.writeFileSync(bootJsonPath, JSON.stringify(bootData, null, 4));
        archive.file(bootJsonPath, { name: "boot.json" });

        await archive.finalize();
    }
}

function getJson(directory: string, filename: string) {
    const filepath = path.join(directory, filename);
    console.log(`Looking for file: ${filepath}`);
    if (!fs.existsSync(filepath)) {
        console.error(`File not found: ${filepath}`);
        return null;
    }
    const json = JSON.parse(fs.readFileSync(filepath, "utf8"));
    return json;
}

(async () => {
    const projectDir = __dirname;
    const outputDir = path.join(__dirname, "build");

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    else {
        fs.readdirSync(outputDir).forEach((file) => {
            if (file.includes("SimpleFramework")) {
			    fs.rmSync(path.join(outputDir, file), { recursive: true, force: true });
            }
		});
    }

    const packRule: PackRule | null = getJson(__dirname, "packrule.json");
    if (!packRule) {
        throw new Error("Failed to load packrule.json. Please ensure the file exists and is valid.");
    }

    const bootTemplate: Record<string, any> | null = getJson(__dirname, "bootTemplete.json");
    if (!bootTemplate) {
        throw new Error("Failed to load boot.json. Please ensure the file exists and is valid.");
    }

    const packager = new ProjectPackager(projectDir, outputDir, packRule, bootTemplate);
    await packager.packageProject();
})();
