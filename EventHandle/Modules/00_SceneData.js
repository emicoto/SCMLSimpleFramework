/* eslint-disable no-use-before-define */

class Trigger {
    constructor(type = 'scene', obj = null, callback = () => true) {
        this.type = type;
        this.cond = callback;
        if (obj !== null) {
            this.set(obj);
        }
    }
    set(obj) {
        for (const key in obj) {
            if (!this[key]) {
                this[key] = clone(obj[key]);
            }
        }
        return this;
    }
    onCheck(flags = {}, passage, prevPassage) {
        if (this.prevPassage) {
            if (this.prevPassage !== prevPassage.title) return false;
        }

        if (this.type === 'scene') {
            if (this.scene) {
                return this.cond(flags, passage, prevPassage) && this.scene === V.stage;
            }
            return this.cond(flags, passage, prevPassage);
        }

        if (this.type === 'passage') {
            return this.checkPasssage(passage.title) && this.cond(flags, passage, prevPassage);
        }

        if (this.type === 'location') {
            return this.checkLocation() && this.cond(flags, passage, prevPassage);
        }

        if (this.type === 'match') {
            return this.checkMatch(passage.title) && this.cond(flags, passage, prevPassage);
        }

        return false;
    }
    checkLocation() {
        if (!this.location) {
            return false;
        }
        // location should be an array
        return this.location.includes(V.location);
    }
    /**
     *
     * @param {string} passage
     * @returns {boolean}
     */
    checkPasssage(passage) {
        if (!this.passage) {
            return false;
        }
        return this.passage === passage;
    }
    /**
     *
     * @param {string} passage
     * @returns {boolean}
     */
    checkMatch(passage) {
        if (!this.match) {
            return false;
        }
        return passage.match(this.match);
    }
}

class SceneData {
    constructor(eventId = '', type = '', priority = 0) {
        this.type = type;
        this.Id = eventId;
        this.priority = priority;

        this.trigger = new Trigger();
    }
    set(obj) {
        for (const key in obj) {
            if (!this[key]) {
                this[key] = clone(obj[key]);
            }
        }
        return this;
    }

    initBranches() {
        if (this.branches && this.branches.length > 0) {
            this.branches = this.branches.map(
                branch =>
                    new BranchData(branch.Id, this.type, branch.priority ?? 0).setParent(this.Id).set(branch)
            );
        }
        return this;
    }

    /**
     * set flag fields of this event which will be checked when the event is triggered
     * @param  {...string} fields
     * @returns {SceneData}
     */
    Flags(...fields) {
        this.flagfield = fields;
        return this;
    }

    Branches(...branches) {
        this.branches = branches;
        return this;
    }

    /**
     * set the trigger of this event
     * @param {string} type
     * @param {function} callback
     * @param {*} obj
     * @returns {SceneData}
     */
    Trigger(type, obj = null, callback) {
        this.trigger = new Trigger(type, obj, callback);
        return this;
    }

    /**
     * set the play options of this event
     * @param {*} options
     * @returns {SceneData}
     */
    PlayOptions(options) {
        this.playOptions = options;
        return this;
    }

    RandomBranch(size = 1) {
        this.randomSize = size;
        return this;
    }

    getRandomBranch() {
        if (this.branches.length === 0) {
            return {
                Id   : `No${Random(1, this.randomSize)}`,
                data : null
            };
        }

        const data = this.branches[Random(0, this.branches.length - 1)];
        return {
            Id : data.Id,
            data
        };
    }

    findBranch(id) {
        return this.branches.find(branch => branch.Id === id);
    }

    // get branch by availbility condition
    getBranch() {
        if (this.randomSize) {
            return this.getRandomBranch();
        }

        if (this.branches.length === 0) {
            return null;
        }

        for (const branch of this.branches) {
            if (branch.cond()) {
                return {
                    Id   : branch.Id,
                    data : branch
                };
            }
        }

        return null;
    }

    sort() {
        this.branches.sort((a, b) => a.priority - b.priority);
    }

    /**
     * set actions when the event is running
     * @param {actionType} action
     * actiontype: init/end/next/phase_x/branch_X; X is the number or id of the branch or phase
     * the action will be triggered when the condition is met
     * next: trigger when the next button is clicked
     * init: trigger before the event starts
     * end: trigger after the event ends
     * branch_X: trigger when the branch X starts
     * phase_X: trigger when the phase X starts
     * @param {function | string} arg the string should be twee code
     * @returns {SceneData}
     */
    Action(action, arg) {
        if (action.has('next')) {
            this.nextButton = true;
        }

        this.actions[action] = arg;

        return this;
    }
}


class BranchData extends SceneData {
    constructor(branchId = '', type = '', priority = 0) {
        super(branchId, type, priority);
        this.trigger = new Trigger('branch');
    }
    setParent(parentId) {
        this.parentId = parentId;
        return this;
    }
}
