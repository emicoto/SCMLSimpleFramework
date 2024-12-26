console.log('[SFDebug] running SimpleContents.js');

setup.ModLocationPNG = [];
setup.ModLocationGIF = [];


//------------------------------------------------------
//
//  新增特征与刺青支持
//
//------------------------------------------------------
setup.ModTraits = [];
setup.ModTraitTitle = [];
setup.addModTrait = function () {
    const Traits = [
        'General Traits',
        'Special Traits',
        'School Traits',
        'Trauma Traits',
        'NPC Traits',
        'Hypnosis Traits',
        'Acceptance Traits'
    ];

    console.log('[SFDebug] Traits:',Traits);
    const initTraits = function (trait) {
        const { addto, name, cond, text, colour } = trait;
        let index;

        if (addto) {
            index = Traits.indexOf(addto);
        }

        const option = {
            name : lanSwitch(name),
            has  : typeof cond === 'function' ? cond() : cond,
            text : lanSwitch(text),
            colour
        };

        return [option, index];
    };

    setup.ModTraitTitle.forEach(option => {
        if (String(option) == '[object Object]') {
            const traits = [];

            if (Array.isArray(option.traits)) {
                option.traits.forEach(trait => {
                    const [data, index] = initTraits(trait);
                    traits.push(data);
                });
            }

            T.traitLists.push({
                title : lanSwitch(option.display),
                traits
            });

            Traits.push(option.title);
        }
    });

    setup.ModTraits.forEach(trait => {
        const [data, index] = initTraits(trait);
        T.traitLists[index].traits.push(data);
    });
};


setup.modTattoos = [];
setup.addBodyWriting = function () {
    setup.modTattoos.forEach(obj => {
        const item = {
            index   : Object.keys(setup.bodywriting).length,
            writing : obj.name,
            type    : obj.type ?? 'text',
            writ_cn : obj.cn ?? obj.name,
            arrow   : obj.arrow ?? 0,
            special : obj.special ?? 'none',
            gender  : obj.gender ?? 'n',
            lewd    : typeof obj.lewd == 'number' ? obj.lewd : 1,
            degree  : obj.degree ?? 0,
            key     : obj.key,
            sprites : obj.sprites ?? []
        };

        setup.bodywriting[obj.key] = item;
        setup.bodywriting_namebyindex[item.index] = obj.key;
    });
};

//------------------------------------------------------
//
//  战斗动作支持
//
//------------------------------------------------------
setup.modCombatActions = [];

setup.ModCombatSetting = function () {
    console.log('[SFDebug] ModCombatSetting:', T.args);
    const [actions, actiontype] = T.args;

    setup.modCombatActions.forEach(setupAction => {
        const { displayname, value, type, condition, color } = setupAction;
        if ((typeof type === 'string' && type == actiontype || Array.isArray(type) && type.has(actiontype)) && typeof condition === 'function' && condition()) {
            const name = lanSwitch(displayname);
            actions[name] = value;
            if (typeof color === 'string') {
                T.args[2] = color;
            }
        }
    });
};

function modCombatDifficul(diffAction, action) {
    console.log('[SFDebug] modCombatDifficul:', T.args, action, diffAction);

    const actionObj = setup.modCombatActions.filter(action => action.value == diffAction)[0];
    if (actionObj && actionObj.widget && Macro.has(actionObj.widget)) {
        return `<<${actionObj.widget}>>`;
    }

    return '';
}
DefineMacroS('ModCombatDifficulty', modCombatDifficul);

setup.modversions = [];

function showModVersions() {
    const versions = setup.modversions.join(' | ');
    const html = `<div id="modversions">Simple Framework v${simpleFrameworks.version} | ${versions}</div>`;
    return html;
}

DefineMacroS('ModVersions', showModVersions);


function showSimpleFrameworkInfo() {
    let html_1 = `<div class="p-2 text-align-center">
        <h3>${lanSwitch('Simple Framework', 'MOD框架')}</h3>

        <div class="m-2">
        ${lanSwitch('Version', '当前版本')}: ${simpleFrameworks.version}<br>
            ${lanSwitch('Author', '作者')}: <span class="gold">${lanSwitch('Lunefox', '狐千月')}</span><br>
            ${lanSwitch('Download Latest version', '获取最新版本')}: [[github|"https://github.com/emicoto/SCMLSimpleFramework"]]<br>
            ${lanSwitch('Mod Guidebook', '模组制作指南')}: [[emicoto.github.io/SCMLSimpleFramework|"https://emicoto.github.io/SCMLSimpleFramework/"]]<br>
        </div>
    </div>`;

    const modlist = iMod.getModList();
    const checkDep = function (arr) {
        if (!Array.isArray(arr)) return false;
        for (let i = 0; i < arr.length; i++) {
            const depinfo = arr[i];
            if (depinfo.modName == 'Simple Frameworks') return true;
        }
        return false;
    };
    const getModName = function (modinfo) {
        if (!modinfo.nickName) return modinfo.modName;
        if (typeof modinfo.nickName === 'string') return modinfo.nickName;

        return lanSwitch(modinfo.nickName.en, modinfo.nickName.cn);
    };

    const html = [];

    for (let i = 0; i < modlist.length; i++) {
        const modId = modlist[i];
        const modinfo = modUtils.getMod(modId);
        if (!modinfo.bootJson) continue;
        if (checkDep(modinfo.bootJson.dependenceInfo) === false) continue;
        
        const modname = getModName(modinfo);
        const modversion = modinfo.version;
        const text = `
        <div class="modinfo">
            ・ ${modname} :  version ${modversion}
        </div>
        `;
        html.push(text);
    }

    if (html.length > 0) {
        html_1 += `
            <div class="p-2 text-align-center">
                <h3>${lanSwitch('Simple Frameworks Mod List', '框架已加载模组')}</h3>
                <div id="modlist">
                ${html.join('')}
                </div>
            </div>
        `;
    }

    return html_1;
}

DefineMacroS('SimpleFrameworkInfo', showSimpleFrameworkInfo);
