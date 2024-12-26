const CustomPopup = (() => {
    function drawPopup(title = '', content = '', options = {}) {
        createBackground();
        createPopupWindow(title, content, options);
    }

    function createPopupWindow(title, content, options) {
        const id = options.id ?? 'customPopup';
        if (document.getElementById(id)) return;

        const popup = document.createElement('div');
        popup.id = id;
        popup.classList.add('draggable');
        popup.classList.add('popup-window');
        if (options.style) {
            popup.classList.add(options.style);
        }
        else {
            popup.classList.add('custom-popup');
        }
        popup.innerHTML = `
            <div id="PopupBanner">
                <div class="popup-title">${title}</div>
                ${options.noBtn ? '<div class="nocloseBtn"></div>' : `<button class="closeBtn" onclick="CustomPopup.close('${id}')">X</button>`}
            </div>
            <div id="PopupContent" class="popup-content">${content}</div>
        `;
        document.getElementById('passages').appendChild(popup);
        $(popup).hide();
    }

    function createBackground() {
        if (document.getElementById('customPopupBG')) return;

        const background = document.createElement('div');
        background.id = 'customPopupBG';
        document.getElementById('passages').appendChild(background);
        $(background).hide();
    }

    function setSize(width, height, id) {
        id ??= 'customPopup';
        const popup = document.getElementById(id);
        if (!popup) return;
        if (width) {
            popup.style.width = width;
        }
        if (height) {
            popup.style.height = height;
        }
    }

    function findAnyPopup() {
        const popup = document.querySelector('.popup-window');
        if (popup) return popup;
        return null;
    }

    function destroyPopup(id) {
        id ??= 'customPopup';
        const popup = document.getElementById(id);
        const bg = document.getElementById('customPopupBG');
        if (popup) {
            popup.remove();
        }
        if (findAnyPopup() === null && bg) {
            $(bg).hide();
        }
    }

    function setContent(content, id) {
        id ??= 'customPopup';
        const main = document.getElementById(id);
        const popup = main.getElementById('PopupContent');
        if (popup) {
            popup.innerHTML = content;
        }
    }

    function showPopup(id) {
        id ??= 'customPopup';
        const popup = document.getElementById(id);
        const bg = document.getElementById('customPopupBG');

        if (!popup) return;

        $(popup).show();
        $(bg).show();

        $(() => {
            $('.draggable').draggable({
                handle : '#PopupBanner',
                cancel : '.popup-content'
            });
        });
    }

    function hidePopup(id) {
        id ??= 'customPopup';
        const popup = document.getElementById(id);
        const bg = document.getElementById('customPopupBG');
        if (popup) {
            $(popup).hide();
        }
        
        if (findAnyPopup() === null && bg) {
            $(bg).hide();
        }
    }

    function createPopup(options) {
        const { id = 'customPopup', title = '', content = '', width, height } = options;
        drawPopup(title, content, options);

        if (width || height) {
            setSize(width, height, id);
        }

        showPopup(id);
    }

    function setPopup(content, id) {
        drawPopup('', content, { id });
        showPopup(id);
    }

    return Object.freeze({
        set    : setPopup,
        create : createPopup,
        draw   : drawPopup,
        close  : destroyPopup,

        show : showPopup,
        hide : hidePopup,
        setContent,
        setSize
    });
})();

const HeaderMsg = (() => {
    let _Msglogs = [];

    function clearLogs() {
        _Msglogs = [];
    }

    function addLog(log) {
        _Msglogs.push(log);
    }

    function print() {
        if (_Msglogs.length === 0) return '';
        return _Msglogs.join('<br>\n');
    }

    function append() {
        const msgdiv = document.createElement('div');
        msgdiv.id = 'headerMsg';

        document.getElementById('passage-header').insertAdjacentElement('afterbegin', msgdiv);
    }

    function show() {
        const header = document.getElementById('headerMsg');
        if (!header) append();

        const html = print();

        new Wikifier(null, `<<replace "#headerMsg" transition>>${html}<</replace>>`);
    }

    return Object.freeze({
        get logs() {
            return _Msglogs;
        },

        add   : addLog,
        clear : clearLogs,
        show
    });
})();
