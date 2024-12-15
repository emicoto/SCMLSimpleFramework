// onHeader
function SFE_onHeader() {
    const psg = Story.get(passage());

    // do header event
    iEventHandler.onBefore(psg);

    return '';
}

DefineMacroS('setStage', iEventUtils.setStage);
DefineMacroS('unsetStage', iEventUtils.unsetStage);
DefineMacro('iEventHeader', SFE_onHeader);
DefineMacro('nextBranch', iEventUtils.nextBranch);
DefineMacro('prevBranch', iEventUtils.prevBranch);
DefineMacro('setBranch', iEventUtils.setBranch);
DefineMacro('endEvent', iEventUtils.endEvent);
DefineMacro('setEvent', iEventUtils.setEvent);
