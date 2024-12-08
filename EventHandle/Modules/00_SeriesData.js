class SeriesData {
    constructor(type, seriesId = '') {
        this.seriesType = type;
        this.Id = seriesId;
        this.data = new Map();
    }

    // get the event by id
    get(id) {
        return this.data.get(id);
    }
    // set SeriesId to all events
    initSeries() {
        const _data = this.data.values();
        _data.forEach(item => {
            item.seriesId = this.Id;
        });
    }

    add(...series) {
        for (const item of series) {
            if (this.get(item.Id)) {
                console.error(`Scene ${item.Id} is already defined`);
                return;
            }
            this.data.set(item.Id, item);
        }

        return this;
    }
}

class EventSeries {
    constructor(seriesId = '', type = 'scene') {
        this.seriesType = type;
        this.Id = seriesId;
        this.data = [];
        this.flagfield = seriesId.toLowerCase();
    }

    get(id) {
        return this.data.find(item => item.Id === id);
    }

    set(prop, value) {
        this[prop] = value;
        return this;
    }

    sort() {
        this.data.sort((a, b) => a.priority - b.priority);
        return this;
    }
    initSeries() {
        const { Id, seriesType } = this;
        const { key, data } = this.getCommon();

        this.data.forEach(item => {
            item.seriesId = Id;
            item.seriesType = seriesType;
            if (key) {
                item[key] = data;
            }
        });
    }
    // add scene to the list
    add(...scene) {
        for (const item of scene) {
            if (this.get(item.Id)) {
                console.error(`Scene ${item.Id} is already defined`);
                return;
            }
            this.data.set(item.Id, item);
        }
        this.sort();
    }

    Cond(callback) {
        this.cond = callback;
        return this;
    }

    // the defualt flagfield of the event.
    Flag(flag) {
        this.flagfield = flag;
        return this;
    }

    // common value for all type of series
    getCommon() {
        switch (this.seriesType) {
        case 'chara':
            return {
                key  : 'chara',
                data : this.chara
            };
        case 'location':
            return {
                key  : 'location',
                data : this.location
            };
        default:
            return {};
        }
    }
}

class ConditionSeries extends EventSeries {
    constructor(seriesId = '') {
        super(seriesId, 'condition');
        this.data = [];
    }
}
