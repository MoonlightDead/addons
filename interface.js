(function () {
    'use strict';

    function create() {
      var html;
      var timer;
      var network = new Lampa.Reguest();
      var loaded = {};

      this.create = function () {
        html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
      };

      this.update = function (data) {
        html.find('.new-interface-info__head,.new-interface-info__details').text('---');
        html.find('.new-interface-info__title').text(data.title);
        html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext'));
        Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
        this.load(data);
      };

      this.draw = function (data) {
        var create = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
        var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
        var head = [];
        var details = [];
        var countries = Lampa.Api.sources.tmdb.parseCountries(data);
        var pg = Lampa.Api.sources.tmdb.parsePG(data);
		var hoursMinutes = `${parseInt(timeDuration(data)[0])}ч ${parseInt(timeDuration(data)[1])}мин`;
        if (create !== '0000') head.push('<span>' + create + '</span>');
        if (countries.length > 0) head.push(countries.join(', '));
        if (vote > 0) details.push('<div class="full-start__rate"><div>' + vote + '</div><div>TMDB</div></div>');
        if (pg) details.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
		 if (data.runtime) details.push('<span class="full-start__pg" style="font-size: 0.9em;">' + hoursMinutes + '</span>');
		 if (data.number_of_seasons) details.push('<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ' + data.number_of_seasons + '</span>');
		if (data.genres && data.genres.length > 0 && Lampa.Storage.field('Genres') == true) details.push(data.genres.map(function (item) {
          return Lampa.Utils.capitalizeFirstLetter(item.name);
        }).join(' '));  
		
        html.find('.new-interface-info__head').empty().append(head.join(', '));
        html.find('.new-interface-info__details').html(details.join('<span class="new-interface-info__split"> </span>'));
      };

      this.load = function (data) {
        var _this = this;

        clearTimeout(timer);
        var url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
        if (loaded[url]) return this.draw(loaded[url]);
        timer = setTimeout(function () {
          network.clear();
          network.timeout(5000);
          network.silent(url, function (movie) {
            loaded[url] = movie;

            _this.draw(movie);
          });
        }, 300);
      };

      this.render = function () {
        return html;
      };

      this.empty = function () {};

      this.destroy = function () {
        html.remove();
        loaded = {};
        html = null;
      };
    }

    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true,
        scroll_by_item: true
      });
      var items = [];
      var html = $('<div class="new-interface"><img class="full-start__background"></div>');
      var active = 0;
      var newlampa = Lampa.Manifest.app_digital >= 166;
      var info;
      var lezydata;
      var viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse';
      var background_img = html.find('.full-start__background');
      var background_last = '';
      var background_timer;

      this.create = function () {};

      this.empty = function () {
        var button;

        if (object.source == 'tmdb') {
          button = $('<div class="empty__footer"><div class="simple-button selector">' + Lampa.Lang.translate('change_source_on_cub') + '</div></div>');
          button.find('.selector').on('hover:enter', function () {
            Lampa.Storage.set('source', 'cub');
            Lampa.Activity.replace({
              source: 'cub'
            });
          });
        }

        var empty = new Lampa.Empty();
        html.append(empty.render(button));
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.loadNext = function () {
        var _this = this;

        if (this.next && !this.next_wait && items.length) {
          this.next_wait = true;
          this.next(function (new_data) {
            _this.next_wait = false;
            new_data.forEach(_this.append.bind(_this));
            Lampa.Layer.visible(items[active + 1].render(true));
          }, function () {
            _this.next_wait = false;
          });
        }
      };

      this.build = function (data) {
        var _this2 = this;

        lezydata = data;
        info = new create(object);
        info.create();
        scroll.minus(info.render());
        data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this));
        html.append(info.render());
        html.append(scroll.render());

        if (newlampa) {
          Lampa.Layer.update(html);
          Lampa.Layer.visible(scroll.render(true));
          scroll.onEnd = this.loadNext.bind(this);

          scroll.onWheel = function (step) {
            if (!Lampa.Controller.own(_this2)) _this2.start();
            if (step > 0) _this2.down();else if (active > 0) _this2.up();
          };
        }

        this.activity.loader(false);
        this.activity.toggle();
      };

      this.background = function (elem) {
        var new_background = Lampa.Api.img(elem.backdrop_path, 'w1280');
        clearTimeout(background_timer);
        if (new_background == background_last) return;
        background_timer = setTimeout(function () {
          background_img.removeClass('loaded');

          background_img[0].onload = function () {
            background_img.addClass('loaded');
          };

          background_img[0].onerror = function () {
            background_img.removeClass('loaded');
          };

          background_last = new_background;
          setTimeout(function () {
            background_img[0].src = background_last;
          }, 300);
        }, 1000);
      };

      this.append = function (element) {
        var _this3 = this;

        if (element.ready) return;
        element.ready = true;
        var item = new Lampa.InteractionLine(element, {
          url: element.url,
          card_small: true,
          cardClass: element.cardClass,
          genres: object.genres,
          object: object,
          card_wide: Lampa.Storage.field('WidePosters'),
          nomore: element.nomore
        });
        item.create();
        item.onDown = this.down.bind(this);
        item.onUp = this.up.bind(this);
        item.onBack = this.back.bind(this);

        item.onToggle = function () {
          active = items.indexOf(item);
        };

        if (this.onMore) item.onMore = this.onMore.bind(this);

        item.onFocus = function (elem) {
          info.update(elem);

          _this3.background(elem);
        };

        item.onHover = function (elem) {
          info.update(elem);

          _this3.background(elem);
        };

        item.onFocusMore = info.empty.bind(info);
        scroll.append(item.render());
        items.push(item);
      };

      this.back = function () {
        Lampa.Activity.backward();
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        if (!viewall) lezydata.slice(0, active + 2).forEach(this.append.bind(this));
        items[active].toggle();
        scroll.update(items[active].render());
      };

      this.up = function () {
        active--;

        if (active < 0) {
          active = 0;
          Lampa.Controller.toggle('head');
        } else {
          items[active].toggle();
          scroll.update(items[active].render());
        }
      };

      this.start = function () {
        var _this4 = this;

        Lampa.Controller.add('content', {
          link: this,
          toggle: function toggle() {
            if (_this4.activity.canRefresh()) return false;

            if (items.length) {
              items[active].toggle();
            }
          },
          update: function update() {},
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.refresh = function () {
        this.activity.loader(true);
        this.activity.need_refresh = true;
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Lampa.Arrays.destroy(items);
        scroll.destroy();
        if (info) info.destroy();
        html.remove();
        items = null;
        network = null;
        lezydata = null;
      };
    }
	
	function timeDuration(data) {
		var timeToSplit = Lampa.Utils.secondsToTime(data.runtime *  60, true).split(':');
	return timeToSplit;
	}
	
    function startPlugin() {
      window.plugin_interface_ready = true;
      var old_interface = Lampa.InteractionMain;
      var new_interface = component;
	  
	  Lampa.SettingsApi.addComponent({
			component: 'Custom_Menu_Component',
			name: 'Кастомизация', //Задаём название меню
			icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_233_3)"><path d="M7 0H9V16H7V0Z" fill="white"/><path d="M0 1H2L5 3V13L2 15H0V1Z" fill="white"/><path d="M11 10.65L14 12.5963V3.4037L11 5.35V3L14 1H16V15H14L11 13V10.65Z" fill="white"/></g><defs><clipPath id="clip0_233_3"><rect width="16" height="16" fill="white"/></clipPath></defs></svg>'
		});
		
			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'useNewInterface',
				type: 'trigger',
				//доступно select,input,trigger,title,static
				default: true
			},
			field: {
				name: 'Использовать стильный интерфейс',
				//Название подпункта меню
				description: '' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
			}

			});
		
			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'WidePosters',
				type: 'trigger',
				//доступно select,input,trigger,title,static
				default: false
			},
			field: {
				name: 'Широкие постеры',
				//Название подпункта меню
				description: '' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
			}

			});
			
			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'Genres',
				type: 'trigger',
				//доступно select,input,trigger,title,static
				default: true
			},
			field: {
				name: 'Показывать жанр',
				//Название подпункта меню
				description: '' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
			}

			});
			
			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'HeightControl',
				type: 'select',
				//доступно select,input,trigger,title,static
				values: {
						Control_Low:	'Низкое',
						Control_Middle:	'Среднее',
						//Control_High:	'Высоко',
				},
				default: 'Control_Middle'
			},
			field: {
				name: 'Положение ленты',
				//Название подпункта меню
				description: 'Положение постеров относительно описания' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
				
			}

			});
			
			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'Theme',
				type: 'select',
				//доступно select,input,trigger,title,static
				values: {
						BWhite:	'Черно-белая',
						Gold:	'Золотая',
						//Control_High:	'Высоко',
				},
				default: 'BWhite'
			},
			field: {
				name: 'Тема',
				//Название подпункта меню
				description: '' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
				
			}

			});
			
/*			Lampa.SettingsApi.addParam({
			component: 'Custom_Menu_Component',
			param: {
				name: 'Weather',
				type: 'trigger',
				//доступно select,input,trigger,title,static
				default: false
			},
			field: {
				name: 'Отображать погоду?',
				//Название подпункта меню
				description: 'Рядом с часами' //Комментарий к подпункту
			},
			onChange: function(value) {
				//Действия при изменении подпункта
				Lampa.Settings.update();
			}

			});
*/			
	  
      Lampa.InteractionMain = function (object) {
        var use = new_interface;
		if (Lampa.Storage.field('useNewInterface') == false) use = old_interface;
        if (!(object.source == 'tmdb' || object.source == 'cub')) use = old_interface;
        if (window.innerWidth < 767) use = old_interface;
        if (Lampa.Manifest.app_digital < 153) use = old_interface;
		if (Lampa.Platform.screen('mobile')) use = old_interface;
        return new use(object);
      };
	  	var heightValue = '0';
		if (Lampa.Storage.field('HeightControl') == 'Control_Low') heightValue = '23';
		if (Lampa.Storage.field('HeightControl') == 'Control_Middle') heightValue = '20';
		if (Lampa.Storage.field('Theme') == 'Gold') startMe();
		
		
		
		//if (Lampa.Storage.field('HeightControl') == 'Control_High') heightValue = '18';
		if (Lampa.Storage.field('WidePosters') == false) {
		Lampa.Template.add('new_interface_style', `\n        <style>\n        .new-interface .card--small.card--wide {\n            width: 18.3em;\n        }\n        \n        .new-interface-info {\n            position: relative;\n            padding: 1.5em;\n            height: ${heightValue}em;\n        }\n        \n        .new-interface-info__body {\n            width: 80%;\n            padding-top: 1.1em;\n        }\n        \n        .new-interface-info__head {\n            color: rgba(255, 255, 255, 0.6);\n            margin-bottom: 1em;\n            font-size: 1.3em;\n            min-height: 1em;\n        }\n        \n        .new-interface-info__head span {\n            color: #fff;\n        }\n        \n        .new-interface-info__title {\n            font-size: 4em;\n            font-weight: 600;\n            margin-bottom: 0.3em;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 1;\n            line-clamp: 1;\n            -webkit-box-orient: vertical;\n            margin-left: -0.03em;\n            line-height: 1.3;\n        }\n        \n        .new-interface-info__details {\n            margin-bottom: 1.6em;\n            display: -webkit-box;\n            display: -webkit-flex;\n            display: -moz-box;\n            display: -ms-flexbox;\n            display: flex;\n            -webkit-box-align: center;\n            -webkit-align-items: center;\n            -moz-box-align: center;\n            -ms-flex-align: center;\n            align-items: center;\n            -webkit-flex-wrap: wrap;\n            -ms-flex-wrap: wrap;\n            flex-wrap: wrap;\n            min-height: 1.9em;\n            font-size: 1.1em;\n        }\n        \n        .new-interface-info__split {\n            margin: 0 1em;\n            font-size: 0.7em;\n        }\n        \n        .new-interface-info__description {\n            font-size: 1.2em;\n            font-weight: 300;\n            line-height: 1.5;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 4;\n            line-clamp: 4;\n            -webkit-box-orient: vertical;\n            width: 70%;\n        }\n        \n        .new-interface .card-more__box {\n            padding-bottom: 150%;\n        }\n        \n        .new-interface .full-start__background {\n            height: 108%;\n            top: -6em;\n        }\n        \n        .new-interface .full-start__rate {\n            font-size: 1.3em;\n            margin-right: 0;\n        }\n        \n        .new-interface .card__promo {\n            display: none;\n        }\n        \n        .new-interface .card.card--wide+.card-more .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .card.card--wide .card-watched {\n            display: none !important;\n        }\n        \n        body.light--version .new-interface-info__body {\n            width: 69%;\n            padding-top: 1.5em;\n        }\n        \n        body.light--version .new-interface-info {\n            height: 25.3em;\n        }\n        </style>\n    `);
	  $('body').append(Lampa.Template.get('new_interface_style', {}, true));

		}
		else {
		Lampa.Template.add('new_interface_style', `\n        <style>\n        .new-interface .card--small.card--wide {\n            width: 18.3em;\n        }\n        \n        .new-interface-info {\n            position: relative;\n            padding: 1.5em;\n            height: ${heightValue}em;\n        }\n        \n        .new-interface-info__body {\n            width: 80%;\n            padding-top: 1.1em;\n        }\n        \n        .new-interface-info__head {\n            color: rgba(255, 255, 255, 0.6);\n            margin-bottom: 1em;\n            font-size: 1.3em;\n            min-height: 1em;\n        }\n        \n        .new-interface-info__head span {\n            color: #fff;\n        }\n        \n        .new-interface-info__title {\n            font-size: 4em;\n            font-weight: 600;\n            margin-bottom: 0.3em;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 1;\n            line-clamp: 1;\n            -webkit-box-orient: vertical;\n            margin-left: -0.03em;\n            line-height: 1.3;\n        }\n        \n        .new-interface-info__details {\n            margin-bottom: 1.6em;\n            display: -webkit-box;\n            display: -webkit-flex;\n            display: -moz-box;\n            display: -ms-flexbox;\n            display: flex;\n            -webkit-box-align: center;\n            -webkit-align-items: center;\n            -moz-box-align: center;\n            -ms-flex-align: center;\n            align-items: center;\n            -webkit-flex-wrap: wrap;\n            -ms-flex-wrap: wrap;\n            flex-wrap: wrap;\n            min-height: 1.9em;\n            font-size: 1.1em;\n        }\n        \n        .new-interface-info__split {\n            margin: 0 1em;\n            font-size: 0.7em;\n        }\n        \n        .new-interface-info__description {\n            font-size: 1.2em;\n            font-weight: 300;\n            line-height: 1.5;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 4;\n            line-clamp: 4;\n            -webkit-box-orient: vertical;\n            width: 70%;\n        }\n        \n        .new-interface .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .full-start__background {\n            height: 108%;\n            top: -6em;\n        }\n        \n        .new-interface .full-start__rate {\n            font-size: 1.3em;\n            margin-right: 0;\n        }\n        \n        .new-interface .card__promo {\n            display: none;\n        }\n        \n        .new-interface .card.card--wide+.card-more .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .card.card--wide .card-watched {\n            display: none !important;\n        }\n        \n        body.light--version .new-interface-info__body {\n            width: 69%;\n            padding-top: 1.5em;\n        }\n        \n        body.light--version .new-interface-info {\n            height: 25.3em;\n        }\n        </style>\n    `);
      $('body').append(Lampa.Template.get('new_interface_style', {}, true));	
		}

	  
	  
	  
    }
function startMe() {
        var styles = `
            body{
                background-color: #564335;
            }

            body,
            .card__vote{
                color: #dfd9ce;
            }
            body.black--style {
                background: #201911;
            }

            .menu__item.focus, 
            .menu__item.traverse, 
            .menu__item.hover,
            .settings-folder.focus,
            .settings-param.focus,
            .selectbox-item.focus,
            .selectbox-item.hover,
            .full-person.focus,
            .full-start__button.focus,
            .full-descr__tag.focus,
            .simple-button.focus,
            .iptv-list__item.focus,
            .iptv-menu__list-item.focus,
            .head__action.focus, 
            .head__action.hover,
            .player-panel .button.focus,
            .search-source.active{
                background: -webkit-gradient(linear, left top, right top, color-stop(1%, rgba(254,244,222,1)),to(rgba(237,207,171,1)));
                background: -webkit-linear-gradient(left, rgba(254,244,222,1) 1%,rgba(237,207,171,1) 100%);
                background: -moz-linear-gradient(left, rgba(254,244,222,1) 1%,rgba(237,207,171,1) 100%);
                background: -o-linear-gradient(left, rgba(254,244,222,1) 1%,rgba(237,207,171,1) 100%);
                background: linear-gradient(to right, rgba(254,244,222,1) 1%,rgba(237,207,171,1) 100%);
                color: #000;
            }

            .settings-folder.focus .settings-folder__icon{
                -webkit-filter: invert(1);
                        filter: invert(1);
            }

            .settings-param-title > span{
                color: #fff;
            }

            .settings__content,
            .settings-input__content,
            .selectbox__content,
            .modal__content{
                background: -webkit-linear-gradient(315deg, rgb(50,46,37) 1%,rgb(10,8,6) 100%);
                background: -moz-linear-gradient(315deg, rgb(50,46,37) 1%,rgb(10,8,6) 100%);
                background: -o-linear-gradient(315deg, rgb(50,46,37) 1%,rgb(10,8,6) 100%);
                background: linear-gradient(135deg, rgb(50,46,37) 1%,rgb(10,8,6) 100%);
            }

            .settings-input__links{
                background-color: rgba(255,255,255,0.2);
            }

            .card.focus .card__view::after, 
            .card.hover .card__view::after,
            .extensions__item.focus:after,
            .torrent-item.focus::after,
            .extensions__block-add.focus:after{
                border-color: rgb(254,244,222);
            }
            .online-prestige.focus::after,
            .iptv-channel.focus::before, 
            .iptv-channel.last--focus::before{
                border-color: rgb(254,244,222) !important;
            }
            .time-line > div,
            .player-panel__position,
            .player-panel__position > div:after{
                background-color: rgb(254,244,222);
            }

            .extensions{
                background: #201911;
            }
            .extensions__item,
            .extensions__block-add{
                background-color: #423a32;
            }
            .torrent-item__size,
            .torrent-item__exe,
            .torrent-item__viewed,
            .torrent-serial__size{
                background-color: #dfd9ce;
                color: #000;
            }

            .torrent-serial{
                background-color: rgba(223,217,206,0.1);
            }
            .torrent-file.focus,
            .torrent-serial.focus{
                background-color: rgba(223,217,206,0.36);
            }

            .iptv-channel{
                background-color: #624e3f !important;
            }
            `;

            var styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet);

    };
	

/*   function WeatherInterface() {
       var html;
        var network = new Lampa.Reguest();
if (Lampa.Storage.field('Weather') == true) {
        this.create = function () {
            html = $('<div class="weather-widget">' +
                    '<div class="weather-temp" id="weather-temp"> </div>' +
                    '<div class="weather-condition" id="weather-condition"></div>' +
                    '</div>');
        };

        this.getWeatherData = function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var API_KEY = "46a5d8546cc340f69d9123207242801";
			var url = 'http:api.weatherapi.com/v1/current.json?key=46a5d8546cc340f69d9123207242801&q=' +  lat + ',' + lon + '&lang=ru&aqi=no';

            network.clear();
            network.timeout(5000);
           network.silent(url, processWeatherData, processError);
        };

       function processWeatherData(result) {
            var data1 = result.location;
            var data2 = result.current;
            var temp = Math.floor(data2.temp_c);  Температура
				console.log("Погода", "Температура: " + temp)
            var condition = data2.condition.text; Обстановка
				console.log("Погода", "Обстановка: " + condition)

            $('#weather-temp').text(temp + '°');
            $('#weather-condition').text(condition).toggleClass('long-text', condition.length > 10);
        }

       function processError() {
            console.log('Error retrieving weather data');
       }

       this.getWeatherByIP = function () {
           $.get("http:ip-api.com/json", function (locationData) {
                console.log("Погода", "Город: " + locationData.city);
                var coords = locationData.lat + ',' + locationData.lon;
               var position = {
                   coords: {
                       latitude: parseFloat(locationData.lat),
                        longitude: parseFloat(locationData.lon)
                   }
                };
                console.log("Погода", "Долгота: " + position.coords.latitude + ", " + "Широта: " + position.coords.longitude)
				this.getWeatherData(position);
            }
                .bind(this));
        };

        this.getWeather = function () {
            if ('geolocation' in navigator) {
               navigator.geolocation.getCurrentPosition(
                    this.getWeatherData.bind(this),
                    this.getWeatherByIP.bind(this));
            } else {
                this.getWeatherByIP();
            }
        };

        this.render = function () {
       };

        this.destroy = function () {
           if (html) {
                html.remove();
                html = null;
            }
        };
}}

    var weatherInterface = new WeatherInterface();
    var isTimeVisible = true;

	if (Lampa.Storage.field('Weather') == true) {
    $(document).ready(function () {
	setTimeout(function(){
        // Создаем интерфейс погоды
       weatherInterface.create();
        var weatherWidget = weatherInterface.render();
        $('.head__time').after(weatherWidget);

        // Функция для переключения между отображением времени и виджета погоды
        function toggleDisplay() {
            if (isTimeVisible) {
                $('.head__time').hide();
                $('.weather-widget').show();
            } else {
                $('.head__time').show();
                $('.weather-widget').hide();
            }
            isTimeVisible = !isTimeVisible;
        }

        // Устанавливаем интервал для переключения между временем и погодой каждые 10 секунд
        setInterval(toggleDisplay, 5000);

        // Получаем начальные данные о погоде
        weatherInterface.getWeather();

        // Скрываем виджет погоды при загрузке страницы
        $('.weather-widget').hide();
		var width_element = document.querySelector('.head__time');
		console.log(width_element.offsetWidth);
		$('.weather-widget').css('width', width_element.offsetWidth + 'px');
		$('.head__time').css('width', width_element.offsetWidth + 'px');
    },5000)
	});}
*/	
	
    if (!window.plugin_interface_ready) startPlugin();

})();

