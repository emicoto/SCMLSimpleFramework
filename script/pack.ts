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
    virtualPath: string;
}

class ProjectPackager {
    private projectDir: string;
    private outputDir: string;
    private packRule: PackRule;
    private bootTemplate: Record<string, any>;
    private gatheredFiles: filedata[];

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
                let filename = file.replace(/\\/g, "/");
                // if the file is in a subfolder, add modulename/ to the path => folder(firstfolder)/modulename/file(rest of the path)
                if (filename.indexOf("/") !== -1) {
                    const fileParts = filename.split("/");
                    filename = `${fileParts[0]}/${i}_${module}/${fileParts.slice(1).join("/")}`;
                }

                const result = {
                    module,
                    realPath: filePath,
                    path: file,
                    virtualPath: filename
                }
                //console.log(`Adding file: ${file}, path: ${filePath}, virtualPath: ${filename}`);
                archive.file(filePath, { name: filename });
                this.gatheredFiles.push(result);
            }

            i++;
        }
    }

    private generateBootJson(gatheredFiles: filedata[]): Record<string, any> {
        const bootData = { ...this.bootTemplate };
        const folderfiles = {}

        //console.log("gatheredFiles", gatheredFiles);

        // Register module-related files
        for (const script of ScriptJson) {
            if (!this.packRule.ScriptFolder[script]) {
                continue;
            }

            console.log(`Processing type: ${script}, patterns:`, this.packRule.ScriptFolder[script]);

            let filepathList: string[] = [];
            if (!folderfiles[script]) {
                folderfiles[script] = [];
            }

            // add files from gatheredFiles that match the file pattern as FolderName/**/*.filetype
            for (const pattern of this.packRule.ScriptFolder[script]) {
                const files = gatheredFiles.filter(file => {
                    const regex = new RegExp(pattern.replace(/\//g, "\\/").replace(/\*\*/g, "(.*)").replace(/\*/g, "(.*)"));
                    return regex.test(file.virtualPath);
                });

                //console.log(`Matched files for pattern: ${pattern}`, files);

                files.forEach(file => filepathList.push(file.virtualPath));

                //console.log(`Files added to ${script}:`, filepathList);

                // sort the files by name smaller to bigger or a to z
                filepathList = filepathList.sort((a, b) => {
                    const aOrder = a.split("/").pop();
                    const bOrder = b.split("/").pop();
                    return aOrder.localeCompare(bOrder);
                });

                // sort the files by module order 
                filepathList = filepathList.sort((a, b) => {
                    const aOrder = a.split("/")[1];
                    const bOrder = b.split("/")[1];
                    return aOrder.localeCompare(bOrder);
                });

                console.log(`Sorted files for ${script}:`, filepathList);

                folderfiles[script].push(...filepathList);
            }
        }
        
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
        const zipFilename = path.join(this.outputDir, `SimpleFramework_ver${versions.version}_build${versions.buildnumber}.zip`);

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

    const packRule: PackRule | null = getJson(__dirname, "packrule.json");
    if (!packRule) {
        throw new Error("Failed to load packrule.json. Please ensure the file exists and is valid.");
    }

    const bootTemplate: Record<string, any> | null = getJson(__dirname, "boot.json");
    if (!bootTemplate) {
        throw new Error("Failed to load boot.json. Please ensure the file exists and is valid.");
    }

    const packager = new ProjectPackager(projectDir, outputDir, packRule, bootTemplate);
    await packager.packageProject();
})();
