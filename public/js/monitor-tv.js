/**
 * Monitor TV layout: current ticket + last called + video.
 */
(function () {
    'use strict';

    const baseUrl = (window.MONITOR_BASE_URL || '');
    const ids = (window.MONITOR_IDS || []);
    const unidade = (window.MONITOR_UNIDADE || {});

    const normalizePath = (path) => (path && path.charAt(0) === '/' ? path : `/${path}`);
    const buildUrl = (path) => {
        if (baseUrl) {
            return baseUrl + normalizePath(path);
        }
        if (typeof App !== 'undefined' && App.url) {
            return App.url(path);
        }
        return normalizePath(path);
    };

    const ajax = (options) => {
        const request = Object.assign({}, options, {
            url: buildUrl(options.url)
        });

        if (typeof App !== 'undefined' && App.ajax) {
            return App.ajax(request);
        }

        const url = new URL(request.url);
        if (request.data) {
            Object.keys(request.data).forEach((key) => {
                url.searchParams.append(key, request.data[key]);
            });
        }
        fetch(url.toString(), {
            method: request.type || request.method || 'get'
        })
            .then((resp) => resp.json())
            .then((json) => {
                if (json && json.success && typeof request.success === 'function') {
                    request.success(json);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (typeof request.complete === 'function') {
                    request.complete();
                }
            });
    };

    const initLocalClock = () => {
        const target = document.getElementById('novosga-clock');
        if (!target) {
            return;
        }

        const serverMillis = (window.MONITOR_MILIS || Date.now());
        const clientStart = Date.now();
        const offset = serverMillis - clientStart;
        const tick = () => {
            const now = new Date(Date.now() + offset);
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const yy = now.getFullYear();
            target.innerHTML = `<span class="time">${hh}:${mm}:${ss}</span><span class="date">${dd}/${mo}/${yy}</span>`;
        };

        tick();
        setInterval(tick, 1000);
    };

    new Vue({
        el: '#monitor',
        data: {
            current: null,
            history: [],
            unidade: unidade,
            pollId: null,
            lastCallId: null,
            alertActive: false,
            alertTimer: null,
        },
        methods: {
            initAudioUnlock() {
                const btn = document.getElementById('monitor-audio-btn');
                const audio = document.getElementById('monitor-alert');
                if (!btn || !audio) {
                    return;
                }

                const unlock = () => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                        const playPromise = audio.play();
                        if (playPromise && typeof playPromise.catch === 'function') {
                            playPromise.catch(() => {});
                        }
                    } catch (e) {
                        // ignore
                    }
                    btn.classList.add('is-hidden');
                };

                btn.addEventListener('click', unlock);
            },
            playAlert() {
                const audio = document.getElementById('monitor-alert');
                if (!audio) {
                    return;
                }
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    const playPromise = audio.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {});
                    }
                } catch (e) {
                    // ignore autoplay restrictions
                }
            },
            triggerAlert() {
                this.playAlert();
                this.speakCall();
                if (this.alertTimer) {
                    clearTimeout(this.alertTimer);
                }
                this.alertActive = true;
                this.alertTimer = setTimeout(() => {
                    this.alertActive = false;
                }, 4000);
            },
            updatePanel(forceAlert = false) {
                ajax({
                    url: '/novosga.monitor/painel',
                    data: {
                        servicos: ids.join(',')
                    },
                    success: (response) => {
                        const data = (response && response.data) ? response.data : [];
                        const nextCurrent = data.length > 0 ? data[0] : null;
                        this.history = data.length > 1 ? data.slice(1, 4) : [];
                        if (nextCurrent) {
                            const nextId = nextCurrent.id || null;
                            if (forceAlert || (nextId && nextId !== this.lastCallId)) {
                                this.triggerAlert();
                            }
                            this.lastCallId = nextId;
                        }
                        this.current = nextCurrent;
                    }
                });
            },
            speakCall() {
                if (!this.current || !window.speechSynthesis) {
                    return;
                }

                const senha = this.current.senha || '';
                const local = this.current.numeroLocal ?? '';
                if (!senha || local === '') {
                    return;
                }

                const phrase = `Senha ${senha}, mesa ${local}.`;
                const utterance = new SpeechSynthesisUtterance(phrase);
                utterance.lang = 'pt-BR';
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }
        },
        mounted() {
            this.initAudioUnlock();
            if (this.unidade && this.unidade.id && typeof App !== 'undefined' && App.SSE) {
                App.SSE.connect([`/unidades/${this.unidade.id}/painel`]);
                App.SSE.onmessage = () => this.updatePanel(true);
                App.SSE.ondisconnect = () => this.updatePanel();
            }

            this.updatePanel();
            this.pollId = setInterval(() => this.updatePanel(), 2000);
        }
    });

    initLocalClock();
})();
