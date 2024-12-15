console.log('[SFDebug] running 1_macromodif.js');

Macro.delete('runeventpool');

Macro.add('runeventpool', {
    skipArgs : true,
    handler() {
        let pick = T.eventpool.find(e => e.name === V.eventPoolOverride);
        if (pick) {
            delete V.eventPoolOverride;
        }
        else if (T.eventpool.includes(V.eventPoolOverride)) {
            pick = V.eventPoolOverride;
            delete V.eventPoolOverride;
        }
        else {
            pick = rollWeightedRandomFromArray(T.eventpool);
        }
        if (!pick) throw new Error('Event pool is empty');
        // Jimmy: For tracking where in the code you may be.
        // E.G: ['eventAmbient', >>'autumn_anystreet_2'<<, 'generate1']
        T.eventpoolRunning = pick.name;
        console.log('[SFDebug/runeventpool] EventPool:', T.eventpoolRunning, pick);

        DOL.Stack.push(pick.name);
        jQuery(this.output).wiki(pick.content);
        DOL.Stack.pop();
    }
});

DefineMacroS('addHeaderMsg', HeaderMsg.add);
DefineMacroS('lanSwitch', window.lanSwitch);
DefineMacroS('getLan', window.getLan);
