const NamedNPC = (() => {
    'use strict';

    /**
     * A list of all named NPC objects.
     */
    const _data = [];
    /**
     * Add a new NPC object or multiple new NPC objects.
     *
     * @param {...NamedNPC} npc The NPC object(s) to be added.
     */
    function _addNpc(...npcs) {
        _data.push(...npcs);
    }

    /**
     * Clear/clean up the NPCs.
     */
    function _clearInvalidNpcs() {
        // - 清理非法NPC
        console.log('[SFInfo] start to reslove npcs....', clone(V.NPCName) , clone(setup.NPCNameList));
        const newnpcs = [];
        for (let i = 0; i < V.NPCName.length; i++) {
            const npc = V.NPCName[i];
            if (setup.NPCNameList.includes(npc.nam)) {
                console.log('[SFInfo] resloving npcs...', npc.nam);
                newnpcs.push(V.NPCName[i]);
            }
        }
        V.NPCName = newnpcs;
        V.NPCNameList = setup.NPCNameList;
        console.log('[SFInfo] npcs resloving done!');
    }

    /**
     * Check if a named NPC is stored in the database.
     *
     * @param {string} name The name of an NPC.
     * @returns {number} The index at which the first NPC with a matching name can be
     * found in the array, or -1 if it is not present.
     */
    function _hasNpc(name) {
        return _data.findIndex(npc => npc.nam == name);
    }

    function _hasVNpc(name) {
        return V.NPCName.find(npc => npc.nam == name);
    }

    /**
     * Switch the language of the NPC names
     */
    function _onSwitchLanguage() {
        V.NPCName.forEach(npc => {
            if (npc.title_lan) {
                npc.title = lanSwitch(npc.title_lan);
            }
            if (npc.displayname_lan) {
                npc.displayname = lanSwitch(npc.displayname_lan);
            }
        });
    }
    
    class NamedNPC {
        /**
         * Constructor to create a new object of the NamedNPC class.
         *
         * @param {string} name The name of the NPC
         * @param {string} title The title of the NPC
         * @param {string} des The description of the NPC
         * @param {string} type The type of the NPC
         */
        constructor(name, title, des, type) {
            this.nam = name;
            this.description = name;

            this.title_lan = title;
            this.description_lan = des;

            this.type = type;

            this.penis = 0;
            this.vagina = 0;
            this.insecurity = 'none';
            this.pronoun = 'none';
            this.penissize = 0;
            this.penisdesc = 'none';
            this.bottomsize = 0;
            this.ballssize = 0;
            this.breastsize = 0;
            this.breastdesc = 'none';
            this.breastsdesc = 'none';
    
            this.skincolour = 'white';
            this.teen = 0;
            this.adult = 1;
            this.init = 0;
            this.intro = 0;
            this.trust = 0;
            this.love = 0;
            this.dom = 0;
            this.lust = 0;
            this.rage = 0;
            this.state = '';
            this.trauma = 0;
    
            this.eyeColour = '';
            this.hairColour = '';


            this.chastity = { penis : '', vagina : '', anus : '' };

            this.purity = 0;
            this.corruption = 0;
    
            this.pregnancy = {};
            this.pregnancyAvoidance = 100;
    
            this.virginity = {
                anal        : false,
                oral        : false,
                penile      : false,
                vaginal     : false,
                handholding : false,
                temple      : false,
                kiss        : false
            };

            this.clothes = {
                set   : '',
                upper : {},
                lower : {}
            };

            this.outfits = ['naked'];
            this.chest = '';
            this.strapons = '';
            this.sextoys = {};
            this.state = 'active';
        }

        /**
         * Initialize the NPC with gender and age.
         *
         * @param {string} gender The gender of the NPC.
         * @param {string} age The age of the NPC.
         * @returns {NamedNPC} The NPC with set gender and age.
         */
        Init(gender, age) {
            this.setGender(gender);
            this.setAge(age);

            return this;
        }

        /**
         * Set the age group of the NPC.
         *
         * @param {string} age The age group of the NPC ('teen' or 'adult').
         * @returns {NamedNPC} The NPC with set age group.
         */
        setAge(age) {
            if (age == 'teen') {
                this.teen = 1;
                this.adult = 0;
            }
            else {
                this.adult = 1;
                this.teen = 0;
            }
            return this;
        }

        /**
         * Set the specific key to the provided value.
         *
         * @param {string} key The key to set.
         * @param {any} value The value of the key.
         * @returns {NamedNPC} The NPC with the key set to the provided value.
         */
        setValue(key, value) {
            this[key] = value;
            return this;
        }

        /**
         * Set the pronouns for the NPC based on their gender.
         *
         * @param {string} gender The gender of the NPC.
         * @returns {NamedNPC} The NPC after updating their pronouns.
         */
        setPronouns(gender = 'f') {
            if (gender == 'm') {
                this.pronouns = {
                    he      : 'he',
                    his     : 'his',
                    hers    : 'hers',
                    him     : 'him',
                    himself : 'himself',
                    man     : 'man',
                    boy     : 'boy',
                    men     : 'men'
                };
            }
            else {
                this.pronouns = {
                    he      : 'she',
                    his     : 'her',
                    hers    : 'hers',
                    him     : 'her',
                    himself : 'herself',
                    man     : 'woman',
                    boy     : 'girl',
                    men     : 'women'
                };
            }
            return this;
        }

        /**
         * Set the gender for the NPC.
         *
         * @param {string} gender The gender to set for the NPC.
         * @returns {NamedNPC} The NPC after updating their gender.
         */
        setGender(gender = 'm') {
            this.gender = gender;
            this.penis = gender == 'm' ? 'clothed' : 'none';
            this.penissize = 3;
            this.penisdesc = 'penis';
            this.vagina = gender == 'm' ? 'none' : 'clothed';
            this.pronoun = gender;
            this.setPronouns(gender);
            this.setOutfits(gender == 'm' ? 'maleDefault' : 'femaleDefault');

            return this;
        }

        /**
         * Set the penis size and description for the NPC.
         *
         * @param {number} size The size of the penis.
         * @param {string} des The description of the penis.
         * @returns {NamedNPC} The NPC after updating their penis size and description.
         */
        setPenis(size, des) {
            this.penissize = size;
            this.penisdesc = des;
            return this;
        }

        /**
         * Set the breast size and description for the NPC.
         *
         * @param {number} size The size of the breasts.
         * @param {string} des The description of the breast.
         * @param {string} desc The description of the breastsdesc.
         * @returns {NamedNPC} The NPC after updating their breast size and description.
         */
        setBreasts(size, des, desc) {
            this.breastsize = size;

            size = Math.clamp(size, 0, setup.breastsize.length);
            this.breastdesc = des ?? size == 0 ? 'nipple' : `${setup.breastsizes[size]} breast`;
            this.breastsdesc = desc ?? size == 0 ? 'nipples' : `${setup.breastsizes[size]} breasts`;
            return this;
        }
        /**
         * Sets the skin, eye and hair color of the NPC.
         *
         * @param {string} skin The skin color.
         * @param {string} eye The eye color.
         * @param {string} hair The hair color.
         * @returns {NamedNPC} The NPC after updating their color properties.
         */
        setColour(skin, eye, hair) {
            if (skin) {
                this.skincolour = skin;
            }
            if (eye) {
                this.eyeColour = eye;
            }
            if (hair) {
                this.hairColour = hair;
            }
            return this;
        }

        /**
         * Set the virginity status of the NPC.
         *
         * @param {object} object The virginity object.
         * @returns {NamedNPC} The NPC after updating their virginity status.
         */
        setVirginity(object) {
            for (const i in object) {
                this.virginity[i] = object[i];
            }
            return this;
        }

        /**
         * initialize the NPC's pregnancy details before game start.
         *
         * @returns {NamedNPC} The NPC after setting their pregnancy details.
         */
        setPregnancy() {
            const pregnancy = {
                fetus             : [],
                givenBirth        : 0,
                totalBirthEvents  : 0,
                timer             : null,
                timerEnd          : null,
                waterBreaking     : null,
                npcAwareOf        : null,
                pcAwareOf         : null,
                type              : null,
                enabled           : true,
                cycleDaysTotal    : random(24, 32),
                cycleDay          : 0,
                cycleDangerousDay : 10,
                sperm             : [],
                potentialFathers  : [],
                nonCycleRng       : [
                    random(0, 3), random(0, 3)
                ],
                pills : null
            };

            pregnancy.cycleDay = random(1, pregnancy.cycleDaysTotal);
            pregnancy.cycleDangerousDay = 10;

            this.pregnancy = pregnancy;
            this.pregnancyAvoidance = 50;
            return this;
        }

        /**
         * Set custom pronouns for the NPC.
         *
         * @param {object} object An object containing custom pronouns.
         * @returns {NamedNPC} The NPC after setting their custom pronouns.
         * @example
         * npcobj.setCustomPronouns( {
         *                 he      : 'he',
         *                 his     : 'his',
         *                 hers    : 'hers',
         *                 him     : 'him',
         *                 himself : 'himself',
         *                 man     : 'man',
         *                 boy     : 'boy',
         *                 men     : 'men'
         *             });
         */
        setCustomPronouns(object) {
            for (const i in object) {
                this.pronouns[i] = object[i];
            }
            return this;
        }

        setOutfits(...outfits) {
            this.outfits.push(...outfits);
            // remove duplicates
            this.outfits = [...new Set(this.outfits)];
            return this;
        }

        setClothes(pos, details) {
            this.clothes[pos] = details;
            return this;
        }

        /**
         * Designate this NPC as important.
         *
         * @returns {NamedNPC} The NPC marked as important.
         */
        isImportant() {
            setup.ModNpcImportant.push(this.nam);
            return this;
        }

        /**
         * Designate this NPC as special.
         *
         * @returns {NamedNPC} The NPC marked as special.
         */
        isSpecial() {
            setup.ModNpcSpecial.push(this.nam);
            return this;
        }
    }

    /**
     * Reset the NPC with the provided data
     *
     * @param {NamedNPC} npc The NPC data to be reset.
     * @returns {NamedNPC} The reset NPC data.
     */
    function _resetNpc(npc) {
        const data = new NamedNPC(npc.nam, npc.title, npc.des, npc.type);
        for (const key in npc) {
            data[key] = npc[key];
        }
    }

    function _sortNpc() {
        // remove duplicates from setup.NPCNameList and V.NPCNameList
        setup.NPCNameList = [...new Set(setup.NPCNameList)];
        V.NPCNameList = [...new Set(V.NPCNameList)];
        
        // sort with setup.NPCNameList
        const { npcs, list } = setup.NPCNameList.reduce((res, npc) => {
            const index = setup.NPCNameList.indexOf(npc);
            res.list[index] = npc;
            const [data] = V.NPCName.filter(data => data.nam == npc);
            res.npcs[index] = data;
            return res;
        }, { npcs : [], list : [] });

        V.NPCName = npcs;
        V.NPCNameList = list;
    }

    function _updateDisplayNames() {
        V.NPCName.forEach(npc => {
            const name = Lang.data.NPCNames[npc.nam];

            if (npc.displayname == undefined && name) {
                npc.displayname = lanSwitch(name);
                npc.displayname_lan = name;
            }
            else if (npc.displayname_lan == undefined && npc.description_lan) {
                npc.displayname_lan = npc.description_lan;
                npc.displayname = lanSwitch(npc.displayname_lan);
            }
            else if (npc.displayname_lan == undefined) {
                npc.displayname_lan = [npc.nam, npc.description];
                npc.displayname = npc.nam;
            }
            else {
                npc.displayname = lanSwitch(npc.displayname_lan);
            }
        });
    }

    /**
     * Update all the NPCs stored in the class database with basic properties defined in this code block.
     */
    function _onUpdate() {
        console.log('[SFInfo] start to update npcs....');

        for (let i = 0; i < _data.length; i++) {
            /**
             * @type {NamedNPC} npc
             */
            const npc = _data[i];
            if (_hasVNpc(npc.nam)) continue;

            console.log('[SFInfo] updating npcs...', npc.nam);

            npc.title = lanSwitch(npc.title_lan);
            npc.displayname = lanSwitch(npc.displayname_lan);

            V.NPCName.push(npc);

            if (!setup.NPCNameList.includes(npc.nam)) {
                setup.NPCNameList.push(npc.nam);
            }

            if (!V.NPCNameList.includes(npc.nam)) {
                V.NPCNameList.push(npc.nam);
            }

            if (!C.npc.hasOwnProperty(npc.nam)) {
                Object.defineProperty(C.npc, npc.nam, {
                    get() {
                        return V.NPCName[setup.NPCNameList.indexOf(npc.nam)];
                    },
                    set(val) {
                        V.NPCName[setup.NPCNameList.indexOf(npc.nam)] = val;
                    }
                });
            }
        }

        _sortNpc();
        _updateDisplayNames();
    }

    /**
     * Initialize the NPCs by updating them.
     */
    function _onInit() {
        _onUpdate();
        console.log('[SFDebug] addNamedNPC', 'init mod npc from storyinit', V.NPCName, setup.NPCNameList);
    }


    Object.defineProperties(NamedNPC, {
        data  : { get : () => _data },
        add   : { value : _addNpc },
        clear : { value : _clearInvalidNpcs },
        has   : { value : _hasNpc },

        onLan  : { value : _onSwitchLanguage },
        reset  : { value : _resetNpc },
        init   : { value : _onInit },
        update : { value : _onUpdate }
    });

    return NamedNPC;
})();
