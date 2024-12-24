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


const ActionHandler = (() => {
    const _data = {
        actions : {
            onLocation  : {},
            onCharacter : {}
        },

        add(type, seriesId, ...actions) {
            let entry;
            if (type === 'stage') {
                entry = 'onLocation';
            }
            else if (type === 'chara') {
                entry = 'onCharacter';
            }
            else {
                entry = type;
                if (!this.actions[entry]) {
                    this.actions[entry] = {};
                }
            }

            if (!this.actions[entry][seriesId]) {
                this.actions[entry][seriesId] = [];
            }

            actions.forEach(action => {
                const data = new Actions(type, action);
                data.set('sId', seriesId);
                this.actions[entry][seriesId].push(data);
            });

            return this.actions[entry][seriesId];
        },
        get(type, id) {
            let typeId;
            if (type === 'stage') {
                typeId = 'onLocation';
            }
            else if (type === 'chara') {
                typeId = 'onCharacter';
            }
            else {
                console.error(`[SF/EventSystem] Invalid action type: ${type}`);
                return '';
            }

            const storage = _data.actions[typeId];
            if (!storage) {
                console.error(`Event type ${typeId} is not defined`);
                return;
            }
            return id ? storage[id] : storage;
        }
    };

    function _getActions(stageId) {
        return _getActionList('stage', stageId);
    }

    function _getActionList(type, id) {
        if (type === 'stage') {
            type = 'onLocation';
        }
        else if (type === 'chara') {
            type = 'onCharacter';
        }
        else {
            console.error(`[SF/EventSystem] Invalid action type: ${type}`);
            return '';
        }

        const actions = _data.actions[type][id];
        if (actions && actions.length > 0) {
            return _generateActionLinks(actions);
        }
        return '';
    }

    function _generateTimeStr(time) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        return `(${hour}:${minute < 10 ? `0${minute}` : minute})`;
    }

    function _generateActionLinks(actions) {
        const getString = data => {
            if (typeof data === 'string') {
                return data;
            }
            if (typeof data === 'function') {
                return data();
            }
            return '';
        };

        const html = [];
        for (let i = 0; i < actions.length; i++) {
            const data = actions[i];

            if (!data.onCheck()) continue;

            const displayTxt = lanSwtich(data.text);
            let target = '';
            if (data.target) {
                target = ` "${getString(data.target)}"`;
            }

            let img = '';
            if (data.img) {
                img = `<<icon "${getString(data.img)}">>`;
            }

            const timeStr = data.time ? _generateTimeStr(data.time) : '(0:01)';

            const pass = `<<pass ${data.time ?? 1}>>`;

            let _html = `${img} <<link "${displayTxt} ${timeStr}"${target}>>`;
            if (!data.nopass) {
                _html += pass;
            }
            _html += `${data.code ?? ''}<</link>><br>`;

            html.push(_html);
        }
        return html.join('');
    }

    function _onStage() {
        const passage = Story.get(V.passage);
        if (passage.tags.includes('stage') === false) {
            return;
        }

        const html = _getActionList('stage', V.stage);
    }

    return Object.freeze({
        get data() {
            return _data;
        },
        add      : _data.add,
        get      : _data.get,
        onGet    : _getActions,
        onListUp : _getActionList,
        generate : _generateActionLinks
    });
})();
