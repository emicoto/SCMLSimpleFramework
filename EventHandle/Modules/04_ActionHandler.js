class ActionData {
    constructor(type, obj = null) {
        this.type = type;
        this.cond = () => true;

        if (obj !== null) {
            for (const key in obj) {
                this[key] = obj[key];
            }
        }
    }

    DisplayTxt(text) {
        this.text = text;
        return this;
    }

    Icon(icon) {
        this.icon = icon;
        return this;
    }

    Target(target) {
        this.target = target;
        return this;
    }

    Cond(cond) {
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
    function _formatType(type) {
        if (type === 'stage') {
            return 'onLocation';
        }
        if (type === 'chara') {
            return 'onCharacter';
        }
        return type;
    }

    const _data = {
        actions : {
            onLocation  : {},
            onCharacter : {}
        },

        add(type, seriesId, ...actions) {
            const typeId = _formatType(type);

            if (!this.actions[typeId]) {
                throw new Error(`Event type ${typeId} is not defined`);
            }

            if (!this.actions[typeId][seriesId]) {
                this.actions[typeId][seriesId] = [];
            }

            if (actions.length > 0) {
                actions.forEach(action => {
                    const data = new ActionData(type, action);
                    data.set('sId', seriesId);
                    this.actions[typeId][seriesId].push(data);
                });
            }

            return this.actions[typeId][seriesId];
        },

        get(type, id) {
            const typeId = _formatType(type);

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
        type = _formatType(type);
        if (!_data.actions[type]) {
            throw new Error(`Event type ${type} is not defined`);
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
        if (!html || html.length === 0) {
            return;
        }

        let $el = $('div#actions');
        if ($el.length === 0) {
            let target = 'div#actions';
            if (document.querySelector('div#actions') === null) {
                target = 'div#extraLink';
            }
            if (document.querySelector('div#extraLink') === null) {
                target = 'div#beforeLink';
            }
            if (document.querySelector('div#beforeLink') === null) {
                target = 'div#passage-content';
            }
            $el = $('<div id="actions"></div>').appendTo(target);
        }

        $el.wiki(html);
    }

    return Object.freeze({
        get data() {
            return _data;
        },
        add      : _data.add,
        get      : _data.get,
        listUp   : _getActions,
        onGet    : _getActionList,
        onStage  : _onStage,
        generate : _generateActionLinks
    });
})();


class LocalAction {
    constructor(stageId, type = 'stage') {
        this.stageId = stageId;
        this.data = ActionHandler.add(type, stageId);
    }

    add(...actions) {
        actions.forEach(action => {
            const data = new ActionData('stage', action);
            data.set('sId', this.stageId);
            this.data.push(data);
        });
        return this.data;
    }

    new() {
        const data = new ActionData('stage', {});
        data.set('sId', this.stageId);
        this.data.push(data);

        return this.data[this.data.length - 1];
    }
}
