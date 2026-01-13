// ==UserScript==
// @name         InterfaceLAMPA Merged
// @version      2.0.0
// @description  Untitled logic + Interface settings & metadata
// @author       You
// ==/UserScript==

(function () {
    'use strict';

    /* ================= НАСТРОЙКИ (ИЗ interface) ================= */

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'WidePosters',
            type: 'trigger',
            default: false
        },
        field: {
            name: 'Широкие постеры'
        },
        onChange: () => Lampa.Settings.update()
    });

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'Genres',
            type: 'trigger',
            default: true
        },
        field: {
            name: 'Показывать жанры'
        },
        onChange: () => Lampa.Settings.update()
    });

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'HeightControl',
            type: 'select',
            values: {
                low: 'Низко',
                middle: 'Средне'
            },
            default: 'middle'
        },
        field: {
            name: 'Положение ленты'
        },
        onChange: () => {
            Lampa.Settings.update();
            applyStyles();
        }
    });

    /* ================= НАСТРОЙКИ (ИЗ untitled) ================= */

    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'DescriptionLines',
            type: 'select',
            values: {
                1: '1 строка',
                2: '2 строки',
                3: '3 строки',
                4: '4 строки',
                5: '5 строк'
            },
            default: 5
        },
        field: {
            name: 'Строки описания'
        },
        onChange: () => {
            Lampa.Settings.update();
            applyStyles();
        }
    });

    /* ================= СТИЛИ (untitled + interface) ================= */

    function applyStyles() {

        let height = '20';
        if (Lampa.Storage.field('HeightControl') === 'low') height = '23';

        let lines = Lampa.Storage.field('DescriptionLines') || 5;

        $('#merged-interface-style').remove();

        $('body').append(`
            <style id="merged-interface-style">

                .new-interface-info {
                    height: ${height}em !important;
                }

                .new-interface-info__description {
                    display: -webkit-box !important;
                    -webkit-line-clamp: ${lines};
                    line-clamp: ${lines};
                    -webkit-box-orient: vertical;
                }

                ${Lampa.Storage.field('WidePosters') ? '' : `
                .new-interface .card--small.card--wide {
                    width: 18.3em;
                }`}

            </style>
        `);
    }

    /* ================= МЕТАДАННЫЕ КАРТОЧКИ (ИЗ interface) ================= */

    const originalDraw = Lampa.Api.sources.tmdb.parse;

    Lampa.Api.sources.tmdb.parse = function (data) {

        let parsed = originalDraw.apply(this, arguments);

        let details = [];

        if (parsed.pg) {
            details.push(`<span class="full-start__pg">${parsed.pg}</span>`);
        }

        if (parsed.runtime) {
            let h = Math.floor(parsed.runtime / 60);
            let m = parsed.runtime % 60;
            details.push(`<span>${h}ч ${m}м</span>`);
        }

        if (parsed.number_of_seasons) {
            details.push(`<span>Сезонов ${parsed.number_of_seasons}</span>`);
        }

        if (parsed.genres && Lampa.Storage.field('Genres')) {
            details.push(parsed.genres.map(g => g.name).join(' '));
        }

        parsed.custom_details = details.join(' • ');

        return parsed;
    };

    /* ================= ИНИЦИАЛИЗАЦИЯ ================= */

    applyStyles();

    Lampa.Listener.follow('full', applyStyles);

})();
