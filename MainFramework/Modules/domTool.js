/**
 * @typedef { string[] | { CN:string, EN:string} } language
 */

const htmlTools = (() => {
    'use strict';

    function isIconImg(node) {
        if (node?.nodeName === 'SPAN' && (node.classList.contains('icon') || node.classList.contains('icon-container'))) {
            return true;
        }
        return node?.nodeName === 'IMG' && node.classList.contains('icon') && (isInteractive(node.nextElementSibling) === true || node?.onClick !== null);
    }

    /**
     * @description append a new div with id before the first image or link in div passage-content
     * @param {string} eId
     * @returns {HTMLElement}
     * @example
     * appendPatch('<<anywidget>>')
     * will append a new div with id extraContent and content <<anywidget>>
     *
     * appendPatch('myContent', '<<anywidget>>')
     * 'myContent' is the id of the new div, and <<anywidget>> is the content
     *
     * appendPatch()
     * will just append a new div with id 'extraContent'
     */
    function appendPatch(pos, ... args) {
        let eId;
        let content = '';

        switch (args.length) {
        case 0:
            eId = 'extraContent';
            break;
        case 1:
            eId = 'extraContent';
            content = args[0];
            break;
        default:
            eId = args[0];
            content = args[1];
            break;
        }

        if (pos == 'before') {
            // find the first image in div passage-content, else find the first link
            let element = document.querySelector('#passage-content .macro-link');
            // check if has image before link
            if (element && isIconImg(element.previousElementSibling)) {
                element = element.previousElementSibling;
            }

            // make a new div with id extraContent
            const div = document.createElement('div');
            div.id = eId;

            // insert the new div before the element
            element.insertAdjacentElement('beforebegin', div);
            new Wikifier(null, `<<append "#${eId}">>${content}<</append>>`);

            return div;
        }

        // if position is after, then find the last link in div passage-content
        const dom = document.getElementById('passage-content');
        const links = dom.getElementsByClassName('macro-link');
        const element = links[links.length - 1];
        
        const div = document.createElement('div');
        div.id = eId;
        element.insertAdjacentElement('afterend', div);
        new Wikifier(null, `<<append "#${eId}">>${content}<</append>>`);

        return div;
    }
    return Object.seal({

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
