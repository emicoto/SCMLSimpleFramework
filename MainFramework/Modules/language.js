/* eslint-disable no-var */
/* eslint-disable max-len */
const Lang = (() => {
    'use strict';

    const _data = {
        NPCNames : {
            Avery          : { EN : 'Avery',        CN : '艾弗利' },
            Bailey         : { EN : 'Bailey',       CN : '贝利' },
            Briar          : { EN : 'Briar',        CN : '布莱尔' },
            Charlie        : { EN : 'Charlie',      CN : '查理' },
            Darryl         : { EN : 'Darryl',       CN : '达里尔' },
            Doren          : { EN : 'Doren',        CN : '多伦' },
            Eden           : { EN : 'Eden',         CN : '伊甸' },
            Gwylan         : { EN : 'Gwylan',       CN : '格威岚' },
            Harper         : { EN : 'Harper',       CN : '哈珀' },
            Jordan         : { EN : 'Jordan',       CN : '约旦' },
            Kylar          : { EN : 'Kylar',        CN : '凯莱尔' },
            Landry         : { EN : 'Landry',       CN : '兰德里' },
            Leighton       : { EN : 'Leighton',     CN : '礼顿' },
            Mason          : { EN : 'Mason',        CN : '梅森' },
            Morgan         : { EN : 'Morgan',       CN : '摩根' },
            River          : { EN : 'River',        CN : '瑞沃' },
            Robin          : { EN : 'Robin',        CN : '罗宾' },
            Sam            : { EN : 'Sam',          CN : '萨姆' },
            Sirris         : { EN : 'Sirris',       CN : '西里斯' },
            Whitney        : { EN : 'Whitney',      CN : '惠特尼' },
            Winter         : { EN : 'Winter',       CN : '温特' },
            'Black Wolf'   : { EN : 'Black Wolf',   CN : '黑狼' },
            Niki           : { EN : 'Niki',         CN : '尼奇' },
            Quinn          : { EN : 'Quinn',        CN : '奎恩' },
            Remy           : { EN : 'Remy',         CN : '雷米' },
            Alex           : { EN : 'Alex',         CN : '艾利克斯' },
            'Great Hawk'   : { EN : 'Great Hawk',   CN : '巨鹰' },
            Wren           : { EN : 'Wren',         CN : '伦恩' },
            Sydney         : { EN : 'Sydney',       CN : '悉尼' },
            'Ivory Wraith' : { EN : 'Ivory Wraith', CN : '白色幽灵' },
            Zephyr         : { EN : 'Zephyr',       CN : '泽菲尔' }
        },
        common : {
            next         : { EN : 'Next', CN : '继续' },
            leave        : { EN : 'Leave', CN : '离开' },
            back         : { EN : 'Back', CN : '返回' },
            items        : { EN : 'Items', CN : '物品' },
            ITEMS        : { EN : 'ITEMS', CN : '物品' },
            unequip      : { EN : 'Unequip', CN : '卸下' },
            equip        : { EN : 'Equip', CN : '装备' },
            move         : { EN : 'Move', CN : '移动' },
            drop         : { EN : 'Drop', CN : '丢弃' },
            willpower    : { EN : 'Willpower', CN : '意志' },
            alcohol      : { EN : 'Alcohol', CN : '酒精' },
            hallucinogen : { EN : 'Hallucinogen', CN : '幻觉' },
            hunger       : { EN : 'Hunger', CN : '饥饿' },
            health       : { EN : 'Health', CN : '健康' },
            storage      : { EN : 'Storage', CN : '库存' },
            mechanic     : { EN : 'Mechanic', CN : '机械' },
            chemical     : { EN : 'Chemical', CN : '化学' },
            cooking      : { EN : 'Cooking', CN : '烹饪' },
            wakeup       : { EN : 'Wake up', CN : '醒来' },
            loiter       : { EN : 'Loiter', CN : '闲逛' },
            take         : { EN : 'Take', CN : '取出' },
            takehalf     : { EN : 'Take half', CN : '取出一半' },
            clearall     : { EN : 'Clear', CN : '清空' },

            boy  : { EN : 'boy', CN : '男孩' },
            girl : { EN : 'girl', CN : '女孩' },

            him     : { EN : 'him', CN : '他' },
            his     : { EN : 'his', CN : '他的' },
            he      : { EN : 'he', CN : '他' },
            himself : { EN : 'himself', CN : '他自己' },
            she     : { EN : 'she', CN : '她' },
            her     : { EN : 'her', CN : '她的' },
            herself : { EN : 'herself', CN : '她自己' }
        }
    };

    function _CheckLanguage() {
        const lancheck = setup.language || navigator.language || navigator.userLanguage;
        let lan = 'EN';
        if (lancheck.includes('zh')) {
            lan = 'CN';
        }

        if (V && V.iModConfigs?.language) {
            lan = V.iModConfigs.language;
        }

        return lan;
    }

    function _findAvailableLanguage(obj) {
        const language = _CheckLanguage();
        if (obj[language] == undefined) {
            return Object.keys(obj)[0];
        }

        return language;
    }
    /**
     * The function to switch language string based on setup variable.
     *
     * @param {...(string|Object|string[])} lan - A list of language strings.
     *   It could be a single object with 'EN' and/or 'CN' properties (type 1),
     *   or two strings (EN and CN) (type 2),
     *   or an array containing these two strings (type 3).
     * @returns {string} - The selected string based on the 'setup.language' value. If 'setup.language' is 'CN', it returns CN value; otherwise, it returns EN value. If CN or EN are not defined, it will try to return the first defined one.
     *
     * @example <caption>Type 1: object as input</caption>
     *   lanSwitch({ EN: 'Hello', CN: '你好'}); // returns 'Hello' if setup.language is not 'CN'
     * @example <caption>Type 2: separate strings as input</caption>
     *   lanSwitch('Hello', '你好'); // returns 'Hello' if setup.language is not 'CN'
     * @example <caption>Type 3: array of strings as input</caption>
     *   lanSwitch(['Hello', '你好']); // returns 'Hello' if setup.language is not 'CN'
     */
    function _languageSwitch(...lanObj) {
        let lan;

        if (isObject(lanObj[0])) {
            lan = _findAvailableLanguage(lanObj[0]);
            return lanObj[0][lan];
        }

        const obj = {
            EN : lanObj[0],
            CN : lanObj[1]
        };

        if (Array.isArray(lanObj[0])) {
            obj.EN = lanObj[0][0];
            obj.CN = lanObj[0][1];
        }

        lan = _findAvailableLanguage(obj);

        return obj[lan];
    }

    function _getLang(keyPath) {
        if (keyPath.includes('.')) {
            const langObj = getPath(_data, keyPath);
            if (langObj == undefined) {
                return `[Language Error] Missing key: ${keyPath}`;
            }
            
            return _languageSwitch(langObj);
        }

        if (_data[keyPath] == undefined) {
            return `[Language Error] Missing key: ${keyPath}`;
        }

        return _languageSwitch(_data[keyPath]);
    }

    function _setLang(obj, keyPath) {
        if (keyPath) {
            const landata = getPath(_data, keyPath);
            for (const key in obj) {
                landata[key] = obj[key];
            }

            return landata;
        }

        for (const key in obj) {
            if (_data[key] == undefined) {
                _data[key] = obj[key];
            }
        }

        return _data;
    }

    Object.defineProperties(window, {
        lanSwitch : {
            value : _languageSwitch
        },

        getLan : {
            value : _getLang
        }
    });
    
    return Object.seal({
        get data() {
            return _data;
        },

        set : _setLang,
        get : _getLang,
        
        check  : _CheckLanguage,
        switch : _languageSwitch
    });
})();


const printer = (() => {
    'use strict';

    function _templet(string, ...args) {
        // check if string is valid
        const isValid = function (str) {
            if (String(str) == '[object Object]' && (str.EN || str.CN)) return true;
            return typeof str === 'string' || Array.isArray(str) || typeof str === 'number';
        };
    
        const isLan = function (str) {
            return String(str) == '[object Object]' || Array.isArray(str);
        };
    
        if (!isValid(string)) return;
    
        if (isLan(string)) {
            string = lanSwitch(string);
        }
    
        for (let i = 0; i < args.length; i++) {
            let txt = args[i];
    
            if (!isValid(txt)) continue;
    
            if (isLan(txt)) {
                txt = Lang.switch(txt);
            }
    
            string = string.replaceAll(`{${i}}`, txt);
        }
        return string;
    }

    function toLower(str) {
        if (String(str) == '[object Object]' && (str.EN || str.CN)) {
            str.EN = str.EN.toLowerCase();
            return str;
        }
        
        if (Array.isArray(str)) {
            str[0] = str[0].toLowerCase();
            return str;
        }
    
        return str.toLowerCase();
    }

    function toUpper(str) {
        if (String(str) == '[object Object]' && (str.EN || str.CN)) {
            str.EN = str.EN.toUpperFirst();
            return str;
        }
        
        if (Array.isArray(str)) {
            str[0] = str[0].toUpperFirst();
            return str;
        }
    
        return str.toUpperFirst();
    }

    function toFull(str) {
        if (String(str) == '[object Object]' && (str.EN || str.CN)) {
            str.EN = str.EN.toUpperCase();
            return str;
        }
        
        if (Array.isArray(str)) {
            str[0] = str[0].toUpperCase();
            return str;
        }
    
        return str.toUpperCase();
    }

    function toCamel(str) {
        if (String(str) == '[object Object]' && (str.EN || str.CN)) {
            str.EN = str.EN.toCamelCase();
            return str;
        }
        
        if (Array.isArray(str)) {
            str[0] = str[0].toCamelCase();
            return str;
        }
    
        return str.toCamelCase();
    }

    return Object.seal({
        templet : _templet,
        toLower,
        toUpper,
        toFull,
        toCamel
    });
})();

// for shortcut
Object.defineProperties(window, {
    P : { get : () => printer },
    L : { get : () => Lang }
});
