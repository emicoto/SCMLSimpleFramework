/**
 * @typedef { string[] | { CN:string, EN:string} } language
 */

const htmlTools = (() => {
    'use strict';

    function _applyBeforeContent(eId = 'patchContent', content) {
        const div = createDiv(eId);
        const dom = document.getElementById('passage-content');
        dom.insertBefore(div, dom.firstChild);

        _wikifyTo(eId, content);
        return div;
    }

    // apply content to the end of main content, before the first image or link
    // should already has a div with id 'addAfterMsg' by ApplyZone patched
    // if something wrent wrong the addAfterMsg not found, then create a new patch div
    function _applyAfterText(eId = 'patchContent', content) {
        const div = createDiv(eId);
        let dom = document.getElementById('addAfterMsg');
        if (!dom) {
            let el = document.querySelector('#passage-content .macro-link');
            if (el && isIconImg(el.previousElementSibling)) {
                el = el.previousElementSibling;
            }
            const newDiv = createDiv('extraPatch_afterContent');
            el.insertAdjacentElement('beforebegin', newDiv);
            dom = document.getElementById('extraPatch_afterContent');
        }

        dom.appendChild(div);

        _wikifyTo(eId, content);
        return div;
    }

    function _applyBeforeLinks(eId = 'patchContent', content) {
        const el = document.querySelector('#passage-content .macro-link');
        return _applyBeforeElment(el, eId, content);
    }

    function _applyAfterLinks(eId = 'patchContent', content) {
        const dom = document.getElementById('passage-content');
        const links = dom.getElementsByClassName('macro-link');
        const el = links[links.length - 1];
        return _applyAfterElment(el, eId, content);
    }

    function _applyAfterElment(elment, eId = 'patchContent', content) {
        if (!elment) return;
        const div = createDiv(eId);
        if (elment.nextElementSibling.tagName == 'BR') {
            elment = elment.nextElementSibling;
        }
        elment.after(div);
        _wikifyTo(eId, content);
        return div;
    }
    
    function _applyBeforeElment(elment, eId = 'patchContent', content) {
        if (!elment) return;
        const div = createDiv(eId);
        if (isIconImg(elment.previousElementSibling)) {
            elment = elment.previousElementSibling;
        }
        _wikifyTo(eId, content);
        return div;
    }

    // apply content after to the specific text node
    // should run after ApplyZone patched
    function _applyToText(text, eId = null, content) {
        // apply content to the text node include the text on page
        const textNodes = ApplyZone.instance.allNodes;
        const txt = lanSwitch(text);
        let node;
        for (let i = 0; i < textNodes.length; i++) {
            const txtnode = textNodes[i];
            if (txtnode.textContent.has(txt)) {
                node = txtnode;
                break;
            }
        }
        if (!node) return;

        const div = createDiv(eId);
        node.parentNode.insertBefore(div, node.nextSibling);
        if (eId == null) {
            eId = `patchText_${htmlTools.applyCount}`;
        }

        _wikifyTo(eId, content);
        htmlTools.applyCount++;
        return div;
    }

    // replace the old text with new text
    // should run after ApplyZone patched
    function _replaceText(oldtext, newtext) {
        const textNodes = ApplyZone.instance.allNodes;
        const txt = lanSwitch(oldtext);
        let target;
        for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            if (node.textContent.has(txt)) {
                target = textNodes[i];
                break;
            }
        }
        // apply a new span with id after the text node
        const span = document.createElement('span');
        span.id = `replaceText_${htmlTools.applyCount}`;
        target.parentNode.insertBefore(span, target.nextSibling);

        // clear the target text
        target.textContent = '';
        _wikifyTo(`replaceText_${htmlTools.applyCount}`, newtext, true);
        htmlTools.applyCount++;
        return span;
    }

    function _append(pos, eId = 'extraContent', content = '') {
        const element = createDiv(eId);

        switch (pos) {
        case 'beforelinks':
            return _applyBeforeLinks(eId, content);
        case 'afterlinks':
            return _applyAfterLinks(eId, content);
        case 'beforemain':
            document.getElementById('passage-content').insertAdjacentElement('afterbegin', element);
            break;
        case 'aftermain':
            document.getElementById('passage-content').insertAdjacentElement('beforeend', element);
            break;
        }

        if (content && content.length > 0) {
            _wikifyTo(eId, content);
        }

        return element;
    }

    /**
     * @description replace the oldlink with newlink
     * @param {string | language} oldlink
     * @param {string} newlink
     * @returns {HTMLElement}
     * @example
     * replaceLink('oldlink', '<<link newlink>><</link>>')
     * replacelink({CN:'旧链接', EN:'oldlink'}, '<<link newlink>><</link>>')
    */
    function _replaceLink(oldlink, newlink) {
        const txt = lanSwitch(oldlink);

        // find the oldlink in elements
        const dom = document.getElementById('passage-content');
        const links = dom.getElementsByClassName('macro-link');
        let elements;
        for (let i = 0; i < links.length; i++) {
            if (links[i].textContent.has(txt)) {
                // replace the oldlink with newlink
                elements = links[i];
                break;
            }
        }
        if (!elements) return;

        // replace the oldlink with newlink
        const parent = elements.parentNode;
        const newlinkPatch = document.createElement('div');
        newlinkPatch.id = `patchlink_${htmlTools.applyCount}`;
        parent.replaceChild(newlinkPatch, elements);

        // wikifier the newlink
        _wikifyTo(`patchlink_${htmlTools.applyCount}`, newlink, true);
        htmlTools.applyCount++;

        return newlinkPatch;
    }


    function _wikifyTo(eId = 'patchContent', content, replace = false) {
        if (replace) {
            new Wikifier(null, `<<replace "#${eId}">>${content}<</replace>>`);
            return;
        }

        new Wikifier(null, `<<append "#${eId}">>${content}<</append>>`);
    }

    /**
     * @description append content after to certain element.
     * first parameter is the type of element, it can be 'text', 'link', 'div', 'span', 'u', 'b', 'i'
     * second parameter is the id of the element or the text of the element
     * third parameter is the content to append
     * fourth parameter can set the id of the new div
     * @param {string} tag
     * @param {string | language | LangType} txt
     * @param {string} content
     * @example
     * appendTo('text', 'you're townie.', '<<anywidget>> or text')
     * - will append a new div with content after the specified text node
     * appendTo('link', ['ENLinkText', 'CNLinkText'], '<<anywidget>> or text')
     * - will append a new div with content after the specified link
     * appendTo('div', 'divId', '<<anywidget>> or text')
     * - will append a new div with content after the specified div
     */
    function _appendTo(tag, txt, content, divId = null) {
        const eType = tag;
        const eId = txt;
        const count = htmlTools.applyCount + 1;
        const dId = divId === null ? `patch${tag}${count}` : divId;
        const dom = document.getElementById('passage-content');

        // if the tag is a text node
        if (eType === 'text') {
            const textNodes = ApplyZone.instance.allNodes;
            const txt = lanSwitch(eId);
            let node;
            for (let i = 0; i < textNodes.length; i++) {
                if (textNodes[i].textContent.has(txt)) {
                    node = textNodes[i];
                    break;
                }
            }
            if (!node) return;
            // append the content after the text node
            const div = createDiv(dId);
            node.parentNode.insertBefore(div, node.nextSibling);
            _wikifyTo(dId, content);
        }
        else if (eType === 'link') {
            const links = dom.getElementsByClassName('macro-link');
            const txt = lanSwitch(eId);
            let node;
            for (let i = 0; i < links.length; i++) {
                if (links[i].textContent.has(txt)) {
                    node = links[i];
                    break;
                }
            }
            if (!node) return;
            // append the content after the link
            _applyAfterElment(node, dId, content);
        }
        else if (eType === 'span' || eType === 'u' || eType === 'b' || eType === 'i') {
            let nodes;
            switch (eType) {
            case 'span':
                nodes = dom.getElementsByTagName('span');
                break;
            case 'u':
                nodes = dom.getElementsByTagName('u');
                break;
            case 'b':
                nodes = dom.getElementsByTagName('b');
                break;
            case 'i':
                nodes = dom.getElementsByTagName('i');
                break;
            }

            const txt = lanSwitch(eId);
            let node;
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].textContent.has(txt)) {
                    node = nodes[i];
                    break;
                }
            }
            if (!node) return;
            _applyAfterElment(node, dId, content);
        }
        else if (eId) {
            const element = dom.getElementById(eId);
            if (!element) {
                throw new Error(`Element with id ${eId} not found`);
            }
            _applyAfterElment(element, dId, content);
        }
        else {
            throw new Error('Invalid element type');
        }
    }

    /**
     * @description insert content before/after certain link
     * @param {'before' | 'after'} position;
     * @param {string} eId;
     * @param {string | language} link;
     * @param {string} content;
     * @returns {HTMLElement}
     * @example
     * insertToLink({link: 'linktext', content:'<<anywidget>>'})
     * //will insert a new div with content before the certain link
     * //the default id of new div is 'patchContent'
     *
     * insertToLink({pos: 'after', link: 'linktext', content:'<<anywidget>>'})
     * //will insert a new div with content after the certain link
     *
     * insertToLink({eId: 'myContent', link: 'linktext', content:'<<anywidget>>'})
     * //'myContent' is the id of the new div
     */
    function _insertToLink(options) {
        if (typeof options.link == 'object') {
            link = lanSwitch(options.link);
        }

        const doc = document.getElementById('passage-content');
        const links = doc.getElementsByClassName('macro-link');
        let element;
        for (let i = 0; i < links.length; i++) {
            if (links[i].innerHTML.has(options.link)) {
                element = links[i];
                break;
            }
        }
        if (!element) return;

        const eID = options.eId ?? 'patchContent';
        if (options.pos == 'before') {
            return _applyBeforeElment(element, eID, options.content);
        }
        
        return _applyAfterElment(element, eID, options.content);
    }

    const state = {
        count : 0,
        init() {
            state.count = 0;
        }
    };

    return Object.seal({
        get applyCount() {
            return state.count;
        },
        set applyCount(value) {
            state.count = value;
        },

        init : state.init,

        wiki         : _wikifyTo,
        append       : _append,
        appendTo     : _appendTo,
        insertToLink : _insertToLink,
        replaceLink  : _replaceLink,
        applyToTxt   : _applyToText,
        replaceTxt   : _replaceText,

        applyAfterText     : _applyAfterText,
        applyBeforeContent : _applyBeforeContent,
        applyBeforeLinks   : _applyBeforeLinks,
        applyAfterLinks    : _applyAfterLinks,
        applyBeforeElment  : _applyBeforeElment,
        applyAfterElment   : _applyAfterElment
    });
})();

function parseXml(xml, arrayTags) {
    let dom = null;
    if (window.DOMParser) dom = new DOMParser().parseFromString(xml, 'text/xml');
    else if (window.ActiveXObject) {
        dom = new ActiveXObject('Microsoft.XMLDOM');
        dom.async = false;
        if (!dom.loadXML(xml)) {
            throw new Error(`${dom.parseError.reason} ${dom.parseError.srcText}`);
        }
    }
    else throw new Error('cannot parse xml string!');

    function parseNode(xmlNode, result) {
        if (xmlnode?.nodeName === '#text') {
            const v = xmlNode.nodeValue;
            if (v.trim()) result['#text'] = v;
            return;
        }

        if (xmlNode.nodeType === Node.CDATA_SECTION_NODE) {
            result['#cdata'] = xmlNode.nodeValue;
            return;
        }

        const jsonNode = {};
        const existing = result[xmlnode?.nodeName];

        if (existing) {
            if (!Array.isArray(existing)) result[xmlnode?.nodeName] = [existing, jsonNode];
            else result[xmlnode?.nodeName].push(jsonNode);
        }
        else {
            if (arrayTags && arrayTags.indexOf(xmlnode?.nodeName) !== -1) result[xmlnode?.nodeName] = [jsonNode];
            else result[xmlnode?.nodeName] = jsonNode;
        }

        if (xmlNode.attributes) {
            for (const attribute of xmlNode.attributes) {
                jsonNode[attribute.nodeName] = attribute.nodeValue;
            }
        }

        for (const childNode of xmlNode.childNodes) {
            parseNode(childNode, jsonNode);
        }
    }

    const result = {};
    for (const node of dom.childNodes) {
        parseNode(node, result);
    }

    return result;
}
