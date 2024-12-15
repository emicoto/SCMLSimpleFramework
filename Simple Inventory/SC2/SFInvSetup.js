
// eslint-disable-next-line no-var
Save.onLoad.add(() => {
    SFInventory.state.set('loading');
});

postrender.SInvInit = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget') || !V.passage) {
        return;
    }

    // already initialized
    if (SFInventory.state.isRunning() === true) {
        return;
    }

    if (!V.Invs) {
        V.Invs = {
            global : {}
        };

        const types = SFInventory.types;
        for (const type of types) {
            V.Invs[type] = {};
        }

        const rules = SFInventory.rules;
        for (const rule of rules) {
            rule.init();
        }
    }

    if (!SFInventory.state.isReady() === false) {
        SFInventory.init();
    }
    else if (SFInventory.state.isLoading() === true) {
        if (iMod.getCf('SimpleInventory')) {
            SFInventory.import();
        }
        SFInventory.state.set('idle');
    }
    $(document).trigger(':inventoryInitDone');
};
