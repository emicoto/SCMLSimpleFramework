class Actions {
    constructor(type, obj = null) {
        this.type = type;
        this.cond = () => true;

        if (obj !== null) {
            for (const key in obj) {
                this[key] = obj[key];
            }
        }
    }
    Icon(icon) {
        this.icon = icon;
        return this;
    }
    Target(target) {
        this.target = target;
        return this;
    }
    Condition(cond) {
        this.cond = cond;
        return this;
    }
    set(prop, value) {
        this[prop] = value;
        return this;
    }
    onCheck() {
        if (this.type === 'chara') {
            return V.npc.has(this.sId) && this.cond();
        }
        if (this.type === 'stage') {
            return V.stage === this.sId && this.cond();
        }

        return this.cond();
    }
}
