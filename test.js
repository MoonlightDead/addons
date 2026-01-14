// ==UserScript==
// @name         bylampa PATCH – Description Lines + Ribbon Height
// @version      1.1.0
// @description  Patch for bylampa: description lines and ribbon height
// ==/UserScript==

(function () {
    'use strict';

    if (window.__bylampa_ui_patch__) return;
    window.__bylampa_ui_patch__ = true;

    /* ======================================================
       SETTINGS
       ====================================================== */

    // Description lines
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
        onChange: applyPatch
    });

    // Ribbon height
    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'bylampa_ribbon_height',
            type: 'select',
            values: {
                0: '0%',
                5: '5%',
                10: '10%',
                15: '15%',
                20: '20%',
                25: '25%',
                30: '30%'
            },
            default: 15
        },
        field: {
            name: 'Высота ленты',
            description: 'Вертикальное положение ленты в карточке bylampa'
        },
        onChange: applyPatch
    });

    /* ======================================================
       CSS PATCH
       ====================================================== */

    function applyPatch() {
        const lines = Lampa.Storage.field('bylampa_description_lines') || 4;
        const ribbon = Lampa.Storage.field('bylampa_ribbon_height') ?? 15;

        const id = 'bylampa-ui-patch-style';
        const old = document.getElementById(id);
        if (old) old.remove();

        const style = document.createElement('style');
        style.id = id;

        style.textContent = `
            /* === bylampa UI PATCH === */

            /* Description lines */
            .new-interface-info__description {
                display: -webkit-box !important;
                -webkit-line-clamp: ${lines} !important;
                line-clamp: ${lines} !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
            }

            /* Ribbon height */
            .new-interface-info {
                margin-top: ${ribbon}vh !important;
            }
        `;

        document.head.appendChild(style);
    }

    /* ======================================================
       LIFECYCLE HOOKS
       ====================================================== */

    applyPatch();

    Lampa.Listener.follow('full', applyPatch);
    Lampa.Listener.follow('activity', applyPatch);
    Lampa.Listener.follow('back', applyPatch);

})();
