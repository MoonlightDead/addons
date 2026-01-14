// ==UserScript==
// @name         bylampa PATCH – Description Lines
// @version      1.0.0
// @description  Patch for bylampa: description line count
// ==/UserScript==

(function () {
    'use strict';

    /* ======================================================
       ЗАЩИТА
       ====================================================== */

    if (window.__bylampa_desc_patch__) return;
    window.__bylampa_desc_patch__ = true;

    /* ======================================================
       НАСТРОЙКА
       ====================================================== */

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'bylampa_description_lines',
            type: 'select',
            values: {
                1: '1 строка',
                2: '2 строки',
                3: '3 строки',
                4: '4 строки',
                5: '5 строк',
                6: '6 строк'
            },
            default: 4
        },
        field: {
            name: 'Описание: строки',
            description: 'Количество строк описания в интерфейсе bylampa'
        },
        onChange: function () {
            Lampa.Settings.update();
            applyPatch();
        }
    });

    /* ======================================================
       CSS PATCH
       ====================================================== */

    function applyPatch() {
        const lines = Lampa.Storage.field('bylampa_description_lines') || 4;
        const id = 'bylampa-description-lines-patch';

        const old = document.getElementById(id);
        if (old) old.remove();

        const style = document.createElement('style');
        style.id = id;

        style.textContent = `
            /* === bylampa description lines PATCH === */

            .new-interface-info__description {
                display: -webkit-box !important;
                -webkit-line-clamp: ${lines} !important;
                line-clamp: ${lines} !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
            }
        `;

        document.head.appendChild(style);
    }

    /* ======================================================
       ХУКИ ЖИЗНЕННОГО ЦИКЛА LAMPA
       ====================================================== */

    applyPatch();

    // вход в карточку
    Lampa.Listener.follow('full', function () {
        applyPatch();
    });

    // смена activity
    Lampa.Listener.follow('activity', function () {
        applyPatch();
    });

    // возврат назад
    Lampa.Listener.follow('back', function () {
        applyPatch();
    });

})();
