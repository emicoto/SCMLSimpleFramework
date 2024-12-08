setup.addNPCList = [];
setup.ModNpcSetting = {};
setup.ModNpcImportant = [];
setup.ModNpcSpecial = [];

setup.ModSocialSetting = function () {
    // make a bakup
    const config = clone(setup.ModNpcSetting);

    // init the options
    for (const [npc, settings] of Object.entries(setup.ModNpcSetting)) {
        for (const [key, option] of Object.entries(settings)) {
            if (typeof option === 'function') {
                settings[key] = option();
            }
            if (typeof option === 'object') {
                for (const i in option) {
                    const value = option[i];
                    if (typeof value === 'function') {
                        option[i] = value();
                    }
                    if (Array.isArray(value) && i == 'displayname') {
                        option.name = lanSwitch(value);
                    }
                }
            }
        }
    }
    Object.assign(T.npcConfig, setup.ModNpcSetting);

    const extra = Object.entries(setup.ModNpcSetting).reduce((list ,[npcname, config]) => {
        if (config.important) {
            list.push(npcname);
        }
        return list;
    }, []);

    T.importantNpcOrder.push(...extra);
    T.specialNPCs.push(...setup.ModNpcSpecial);

    // reset the configs
    setup.ModNpcSetting = config;
};

setup.ModLoveInterest = function () {
    // 把列表塞npc对照表
    T.npc.push(...setup.ModNpcImportant);

    // 根据条件塞入可选项
    setup.ModNpcImportant.forEach(npc => {
        const config = setup.ModNpcSetting[npc];
        if (config && typeof config.loveInterest === 'function') {
            if (config.loveInterest()) {
                T.potentialLoveInterests.push(npc);
            }
        }
        else if (config && typeof config.loveInterest === 'boolean') {
            if (config.loveInterest) {
                T.potentialLoveInterests.push(npc);
            }
        }
        else {
            T.potentialLoveInterests.push(npc);
        }
    });

    T.loveInterestSelections = {};
    const non = lanSwitch('None', '没有人');
    T.loveInterestSelections[non] = 'None';

    T.potentialLoveInterests.forEach(nnpc => {
        if (nnpc !== 'None') {
            const key = C.npc[nnpc].displayname;
            T.loveInterestSelections[key] = nnpc;
        }
    });
};
