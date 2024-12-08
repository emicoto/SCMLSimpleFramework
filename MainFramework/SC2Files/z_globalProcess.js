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


postrender.iModInit = function () {
    if (iMod.state.isReady() === true || iMod.state.isLoading() === false) {
        return;
    }

    if (typeof V.iModConfig === 'undefined' || typeof V.iModVar === 'undefined') {
        iMod.init();
    }

    if (typeof V.tvar === 'undefined') {
        V.tvar = {
            init : 1
        };
    }

    if (typeof Tvar === 'undefined') {
        Object.defineProperty(window, 'Tvar', {
            get() {
                return V.tvar;
            }
        });
        console.log('[SF] variable Tvar is ready:', Tvar);
    }

    const lang = iMod.getCf('language') ?? null;

    // if the language setting is not initialized
    if (lang === null) {
        iMod.setCf('language', setup.language);
    }

    if (iMod.state.isLoading() === true && lang !== null) {
        setup.language = iMod.getCf('language');
    }

    iMod.state.state = 'Ok';
};


postdisplay.updateModActions = function () {
    if (passage() == 'Start' && setup.modCombatActions.length > 0) {
        console.log('[SFDebug] Initializing Mod Combat Colours Setting...');
        setup.modCombatActions.forEach(action => {
            const { value, color, mainType } = action;
            if (typeof color === 'string' && typeof mainType === 'string') {
                combatActionColours[mainType][color].push(value);
            }
        });
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
//  NPC相关进程处理
//
//------------------------------------------------------
postdisplay.SF_onPostNpc = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget')) {
        return;
    }

    if (!V.passage || passage.title == 'Start' || passage.title == 'Downgrade Waiting Room' || V.passage == 'Start' || V.passage == 'Downgrade Waiting Room') {
        return;
    }

    if (setup.iModOnLoad || setup.iModInit || setup.iModOnDowngrade) {
        NamedNPC.clear();
        NamedNPC.update();
        setup.iModOnLoad = false;
        setup.iModInit = false;
    }
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


$(document).on(':passageend', () => {
    if (HeaderMsg.logs.length > 0) {
        HeaderMsg.show();
        HeaderMsg.clear();
    }
});
