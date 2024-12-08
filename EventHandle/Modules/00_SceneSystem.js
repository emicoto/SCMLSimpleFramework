//---------------------------------------------------------------------------------------------
// Scene
//
// this class is used to generate a running scene from the scene data
// and provide some useful methods to check the scene status
//---------------------------------------------------------------------------------------------
class Scene {
    constructor(type = 'scene', episode, data = null) {
        const _type = type[0].toUpperCase() + type.slice(1);

        this.type = type;
        this.episode = episode;
        this.data = data;
        
        if (this.data === null && V.stage) {
            this.stage = V.stage;
            this.fullTitle = `${_type} ${V.stage} ${this.episode}`;
            this.baseTitle = this.fullTitle;
        }

        this.startTime = V.timeStamp;
        this.exit = V.passage;
    }

    initData() {
        const data = this.data;
        if (!data) return this;

        // make a backup of the original data
        this.source = clone(data);

        this.seriesId = data.seriesId;
        this.eventId = data.eventId;

        this.startTime = V.timeStamp;
        this.exit = data.exit || V.passage;
        this.maxPhase = data.maxPhase ?? 0;

        this.fullTitle = this.getFullTitle();
        this.stage = this.getStage();

        this.branch = [];

        return this;
    }

    init() {
        const { chara , actions } = this.data;
        if (chara) {
            chara.forEach(cha => {
                wikifier('npc', cha);
            });

            wikifier('person1');
        }

        if (actions.init) {
            if (typeof actions.init === 'function') {
                actions.init();
            }
            else if (typeof actions.init === 'string') {
                new Wikifier(null, actions.init);
            }
        }
    }

    getBranch() {
        const branch = this.data.getBranch();
        if (branch === null) return;

        const { Id, data } = branch;
        this.branch.push(Id);
        if (isValid(data)) {
            this.initBranch(data);
        }
    }

    getFullTitle() {
        const type = this.type[0].toUpperCase() + this.type.slice(1);
        const { title } = this.data;

        let _title = `${type} ${this.seriesId} ${this.episode}`;
        if (this.seriesType == 'condition') {
            _title = `${type} ${this.episode}`;
        }
        if (title) {
            _title = title;
        }

        this.baseTitle = title;

        if (this.branch.length > 0) {
            _title += ` ${this.branch.join(' ')}`;
            this.currentBranch = this.branch[ this.branch.length - 1 ];
        }

        if (this.maxPhase && V.phase < this.maxPhase) {
            _title += ` p${V.phase + 1}`;
        }

        return _title;
    }

    initLanguage() {
        const fullTitle = this.getFullTitle();

        if (Story.has(`${fullTitle} ${setup.language}`)) {
            return `${fullTitle} ${setup.language}`;
        }

        if (Story.has(`${fullTitle} CN`)) {
            return `${fullTitle} CN`;
        }

        if (Story.has(`${fullTitle} EN`)) {
            return `${fullTitle} EN`;
        }

        if (Story.has(`${fullTitle}`)) {
            return fullTitle;
        }

        console.warn(`Scene ${fullTitle} is not found, try to use the base title`);

        if (Story.has(`${this.baseTitle} ${setup.language}`)) {
            return `${this.baseTitle} ${setup.language}`;
        }

        if (Story.has(`${this.baseTitle} CN`)) {
            return `${this.baseTitle} CN`;
        }

        if (Story.has(`${this.baseTitle} EN`)) {
            return `${this.baseTitle} EN`;
        }

        return this.baseTitle;
    }

    getLanguage() {
        const fullTitle = this.getFullTitle();

        if (Story.has(`${fullTitle} ${setup.language}`)) {
            return `${fullTitle} ${setup.language}`;
        }

        if (Story.has(`${fullTitle} CN`)) {
            return `${fullTitle} CN`;
        }

        if (Story.has(`${fullTitle} EN`)) {
            return `${fullTitle} EN`;
        }

        return fullTitle;
    }

    getStage() {
        const data = this.data;
        if (!data.playOptions) {
            if (data.type === 'scene') {
                return Story.get(`Stage ${this.seriesId}`) ? `Stage ${this.seriesId}` : `Stage ${V.stage}`;
            }
            return data.stage ?? 'SFEventLoop';
        }

        const option = data.playOptions;
        if (option.type === 'scene' && V.stage) {
            return `Stage ${V.stage}`;
        }

        if (option.type === 'stage' && option.stage) {
            return `Stage ${option.stage}`;
        }

        if (option.type === 'passage' && option.passage) {
            return option.passage;
        }

        return data.stage ?? 'SFEventLoop';
    }

    initBranch(branchData) {
        if (!branchData) return;
        const list = ['maxPhase', 'actions', 'flagfield', 'exit', 'chara'];
        for (let i = 0; i < list.length; i++) {
            const key = list[i];
            if (branchData[key]) {
                this.data[key] = branchData[key];
                this[key] = branchData[key];
            }
        }

        this.branch.push(branchData.Id);
    }

    reset() {
        this.data = clone(this.source);
        this.maxPhase = this.source.maxPhase ?? 0;
        this.branch = [];
        return this;
    }

    restore(scene) {
        if (scene) {
            for (const key in scene) {
                this[key] = scene[key];
            }
        }
        else if (this.source) {
            this.data = clone(this.source);
        }
    }
}
