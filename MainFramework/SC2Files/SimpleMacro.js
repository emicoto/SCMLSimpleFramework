/* eslint-disable max-len */
console.log('[SFDebug] running SimpleMacro.js');

Macro.add('randomdata', {
    tags : ['datas'],
    handler() {
        const len = this.payload.length;
        const rateMode = this.payload[0].source.includes('rate');

        console.log('[SFDebug/randomdata] payload:',this.payload);
        if (len == 1) return this.error(`[SFDebug] no data found from randomdata: ${this.payload[0].source}${this.payload[0].contents}`);

        if (!rateMode) {
            const index = random(1, len - 1);
            const data = this.payload[index].contents;
            jQuery(this.output).wiki(data);
            return;
        }

        const datas = new Array(len - 1).fill({ rate : 0, contents : '' });
        let defaultText = '';

        this.payload.forEach((data, index) => {
            if (index == 0) return;

            const rate = data.source.match(/\d+/);
            datas[index - 1] = { rate : Number(rate), contents : data.contents };

            if (!rate) {
                defaultText = data.contents;
            }
        });

        // sort by rate, biggest to smallest
        datas.sort((a, b) => b.rate - a.rate);

        // if not default set, the biggest one will be the default text
        if (defaultText == '') {
            defaultText = datas[0].contents;
        }

        console.log('[SFDebug/randomdata] datas:',datas);

        // get total rate
        let total = datas.reduce((res, cur) => res + cur.rate, 0);

        // sort by rate, smaller to bigger
        datas.sort((a, b) => a.rate - b.rate);

        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            const rate = random(1, total);

            if (Config.debug) {
                console.log('[SFDebug/randomdata] random rate:', rate, 'total:', total, 'data rate:', data.rate, 'data:', data.contents);
            }

            if (rate < data.rate) {
                jQuery(this.output).wiki(data.contents);
                return;
            }

            total -= data.rate;
        }

        jQuery(this.output).wiki(defaultText);
    }
});


Macro.add(['lanLink', 'lanButton'], {
    isAsync : true,
    tags    : ['lan', 'linkcode'],
    handler() {
        const passage = this.args[0];

        if (this.payload.length == 1) return this.error('[SFDebug/lanlink] no link text found');

        const languages = this.payload.filter(data => data.name == 'lan').map(data => data.args);
        const code = this.payload.filter(data => data.name == 'linkcode')[0]?.contents ?? null;

        if (languages.length == 0) return this.error('[SFDebug/lanlink] no language text found');

        if (Config.debug) console.log('[SFDebug/lanlink] ',languages, code);

        let displaytext = '';
        for (let i = 0; i < languages.length; i++) {
            if (languages[i][0] == setup.language) {
                displaytext = languages[i][1];
                break;
            }
        }

        if (displaytext == '') {
            displaytext = languages[0][1];
        }

        const link = jQuery(document.createElement(this.name === 'lanButton' ? 'button' : 'a'));
        link.wikiWithOptions({ profile : 'core' }, displaytext);

        if (!passage) {
            link.addClass('link-internal');
        }
        else {
            link.attr('data-passage', passage);

            if (Story.has(passage)) {
                link.addClass('link-internal');
                T.link = true;

                if (Config.addVisitedLinkClass && State.hasPlayed(passage)) {
                    $link.addClass('link-visited');
                }
            }
            else {
                link.addClass('link-broken');
            }
        }

        link.addClass(`macro-${this.name == 'lanButton' ? 'button' : 'link'}`)
            .ariaClick(
                {
                    namespace : '.macros',
                    one       : typeof passage == 'string' && passage.length > 0
                },
                this.createShadowWrapper(
                    typeof code == 'string' ?
                        () => {
                            Wikifier.wikifyEval(code.trim());
                        }
                        : null,

                    typeof passage == 'string' && passage.length > 0 ?
                        () => {
                            const target = document.querySelector('#storyCaptionDiv');
                            window.scrollUIBar = target ? target.scrollTop : null;
                            window.scrollMain = document.scrollingElement.scrollTop;
                            SugarCube.Engine.play(passage);
                        }
                        : null
                )

            )
            .appendTo(this.output);
    }
});

/**
 * This function picks and returns one of the two provided values based on
 * the gender of a given NPC (non-player character) or player.
 * The female and male parameters should be of the same type. The type of return value matches the type of these two parameters.
 *
 * @template T
 * @param {(string|number)} npc - The identifier for the non-player character (npc) or the player.
 * - If it's a string other than 'pc', it's assumed to be an id from C.npc.
 * - If it's 'pc', it's assumed to be the player.
 * - If it's a number, it's assumed to be an array index.
 * @param {T} female - The value to return if the npc or player is female. Should be of same type as 'male'.
 * @param {T} male - The value to return if the npc or player is male. Should be of same type as 'female'.
 * @param {T} other - The value to return if the npc or player is herm. Should be of same type as 'female'.
 * @returns {T} - Returns female or male value according to the gender of the given npc or player.
 *
 * @example
 *  sexSwitch('pc', 'value for female', 'value for male'); // returns value based on the player's gender
 *  sexSwitch('npc_id', 'value for female', 'value for male'); // returns value based on npc_id from C.npc
 *  sexSwitch(2, 'value for female', 'value for male'); // returns value based on npc at index 2 in array
 */
function sexSwitch(npc, female, male, other) {
    let gender = 'f';
    if (npc !== 'pc' && typeof npc == 'string') {
        gender = C.npc[npc].gender;
    }
    else if (typeof npc == 'number') {
        gender = V.NPCList[V.index]?.gender ?? 'm';
    }
    else {
        gender = V.player.gender_appearance;
    }

    if (gender == 'm') {
        return male;
    }

    if (other && gender !== 'f') {
        return other;
    }

    return female;
}

window.sexSwitch = sexSwitch;
DefineMacroS('sexSwitch', sexSwitch);


function relationshipTextHook(npcnam) {
    const wname = npcnam.replace(/\s/g, '').replace(' ', '');
    const widget = `${wname}Opinion`;
    const widgetIcon = `${wname}OpinionIcon`;

    console.log('[SFDebug] call from relationship text hook:',npcnam, wname);
    console.log('[SFDebug] widgets:', widget, Macro.has(widget), Macro.has(widgetIcon), widgetIcon);

    let text = '<<relationshiptext>>';

    if (Macro.has(widget)) {
        text = `<<ModaddNPCRelationText ${npcnam}>>`;
    }

    if (Macro.has(widgetIcon)) {
        text += `<<${widgetIcon}>>`;
    }

    console.log('[SFDebug] relationship text:', text);

    return text;
}
DefineMacroS('ModRelationshipText', relationshipTextHook);

/**
 * Retrieves the language-specific pronoun for a given non-player character (NPC) or player.
 *
 * @param {string|number} npc - The identifier for the non-player character (NPC) or player. If it's 0, it uses the NPC at the current index in V.NPCList.
 * @returns {string} - This function returns 'boy' or 'girl' depending on the gender. This string is returned in the language specified in setup.language.
 *
 * @example
 *  nnpcboy('npc_id'); // returns 'boy' or 'girl' based on npc_id's gender from C.npc
 *  nnpcboy(0); // returns 'boy' or 'girl' based on npc's gender at current index in V.NPCList
 */
function nnpcboy(npc) {
    let gender = C.npc[npc].pronoun;

    if (npc == 0) {
        gender = V.NPCList[V.index].pronoun;
    }
    if (gender == 'm') {
        return Lang.get('common.boy');
    }

    return Lang.get('common.girl');
}
DefineMacroS('nnpcboy', nnpcboy);

/**
 * This function retrieves the language-specific pronoun for a given non-player character (NPC) or player and converts the first character to upper case.
 *
 * @param {string|number} npc - The identifier for the non-player character (NPC) or player. If it's 0, it uses the NPC at the current index in V.NPCList.
 * @returns {string} - This function returns 'Boy' or 'Girl' depending on the gender. This string is returned in the language specified in setup.language. The first character is converted to upper case.
 *
 * @example
 *  nnpcBoy('npc_id'); // returns 'Boy' or 'Girl' based on npc_id's gender from C.npc
 *  nnpcBoy(0); // returns 'Boy' or 'Girl' based on npc's gender at current index in V.NPCList
 */
function nnpcBoy(npc) {
    return nnpcboy(npc).toUpperFirst();
}
DefineMacroS('nnpcBoy', nnpcBoy);

/**
 * This function retrieves the language-specific version of input pronoun from a predefined list.
 *
 * @param {string} pronun - The input pronoun which is either 'him', 'her', 'his', 'hers', 'he', or 'she'.
 *                          The case doesn't matter and it can start with an uppercase letter.
 * @returns {string} - This function returns the language-specific version of the input pronoun
 *                     based on the setup.language setting. The first character is converted to upper
 *                     case if and only if the input pronoun started with an uppercase letter.
 *
 * @example
 *  pcpn('him'); // returns 'him' or '他' based on the setup.language setting
 *  pcpn('Him'); // returns 'Him' or '他' based on the setup.language setting
 */
function pcpn(pronun) {
    const pron = pronun.toLowerCase();

    if (pronun[0] == pronun[0].toUpperCase()) {
        return Lang.get(`common.${pron}`).toUpperFirst();
    }

    return Lang.get(`common.${pron}`);
}

DefineMacroS('pcpn', pcpn);

/**
 * This function returns a text message based on the value of the speech attitude.
 *
 * @param {string} bratty - The text to return if the speech attitude is 'bratty'.
 * @param {string} neutral - The text to return if the speech attitude is 'neutral'.
 * @param {string} meek - The text to return if the speech attitude is 'meek'.
 * @returns {string} - Returns the corresponding text based on the value of the speech attitude.
 *
 * @example
 *  speechDif('Bratty text', 'Neutral text', 'Meek text'); // returns text based on the value of V.speech_attitude
 */
function speechDif(bratty, neutral, meek) {
    if (V.speech_attitude == 'bratty') return bratty;
    if (V.speech_attitude == 'neutral') return neutral;
    if (V.speech_attitude == 'meek') return meek;
}
window.speechDif = speechDif;
DefineMacroS('speechDif', speechDif);

/**
 * @param  {Array<[function, string]>} condtxt - An array of arrays. Each sub-array should contain a function that returns a boolean value and a string.
 * @returns {string} - Returns the corresponding text based on the value of the speech attitude.
 */
function cond(...condtxt) {
    for (let i = 0; i < condtxt.length; i++) {
        if (condtxt[i][0]) {
            return condtxt[i][1];
        }

        return condtxt[condtxt.length - 1][1];
    }
}
window.cond;
DefineMacroS('cond', cond);

