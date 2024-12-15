console.log('[SFDebug] running z_globalProcess.js');
//------------------------------------------------------
//
//  进程处理
//
//------------------------------------------------------

setup.language = Lang.check();

// if the current passage does not implement the content div, then add it
prehistory.updatePassageDiv = function () {
    console.log('[SFDebug] onPreInit:', this, this.title, this.element);
    const passage = this;
    if (!passage || passage.tags.has('widget')) {
        return;
    }

    if (passage.title == 'Start' || passage.title == 'Downgrade Waiting Room') {
        return;
    }

    const source = passage.element.innerText;
    if (!source.includes('passage-content')) {
        this.element.innerText = `<div id='passage-content'>${source}</div>`;
    }
};


prehistory.iModInit = function () {
    console.log('[SFDebug] onPreInit:', this, this.title);
    if (iMod.state.isReady() === false || iMod.state.isLoading() === true) {
        iMod.init();
    }

    if (iMod.state.isLoading() === true) {
        setup.language = iMod.getCf('language') ?? Lang.check();
    }
};


postrender.updateModActions = function () {
    const psg = this;
    if (!psg || setup.modCombatActionsInit) {
        return;
    }

    if (!setup.modCombatActionsInit) {
        console.log('[SFDebug] Initializing Mod Combat Colours Setting...');
        setup.modCombatActions.forEach(action => {
            const { value, color, mainType } = action;
            if (typeof color === 'string' && typeof mainType === 'string') {
                combatActionColours[mainType][color].push(value);
            }
        });
        
        setup.modCombatActionsInit = true;
    }
};

postrender.SFUpdate = function () {
    const psg = this;
    if (!psg || psg.tags.has('widget')) {
        return;
    }

    htmlTools.init();
    console.log('[SFDebug] onPostRender:', psg.title);
    if (psg.title == 'Downgrade Waiting Room') {
        return;
    }

    if (NamedNPC.state.isReady() === false) {
        NamedNPC.init();
    }
    else if (iMod.state.isLoading() === true) {
        NamedNPC.clear();
        NamedNPC.update();
    }

    if (iMod.state.isReady() === false || iMod.state.isLoading() === true) {
        iMod.state.setReady();
    }
};


postdisplay.SF_onPost = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget')) {
        return;
    }

    if (!V.passage || passage.title.has('Start', 'Downgrade Waiting Room', 'Settings') !== false || V.passage.has('Start', 'Downgrade Waiting Room', 'Settings') !== false) {
        return;
    }

    if (V.combat == 1) {
        ApplyZone.applyCombat();
    }
    else {
        ApplyZone.applyZone();
    }

    $(document).trigger(':postApplyZone');
};

//------------------------------------------------------
//
//  document事件监听
//
//------------------------------------------------------
$(document).on(':switchlanguage', () => {
    NamedNPC.onLan();
    iMod.setCf('language', setup.language);
});


$(document).on(':postApplyZone', () => {
    if (HeaderMsg.logs.length > 0) {
        HeaderMsg.show();
        HeaderMsg.clear();
    }
});
