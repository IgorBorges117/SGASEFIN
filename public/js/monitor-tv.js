/**
 * Monitor TV layout: current ticket + last called + video.
 */
(function () {
    'use strict';

    new Vue({
        el: '#monitor',
        data: {
            current: null,
            history: [],
            unidade: (typeof unidade !== 'undefined' ? unidade : {}),
        },
        methods: {
            updatePanel() {
                App.ajax({
                    url: App.url('/novosga.monitor/painel'),
                    data: {
                        servicos: (typeof ids !== 'undefined' ? ids.join(',') : '')
                    },
                    success: (response) => {
                        const data = (response && response.data) ? response.data : [];
                        this.current = data.length > 0 ? data[0] : null;
                        this.history = data.length > 1 ? data.slice(1, 4) : [];
                    }
                });
            }
        },
        mounted() {
            if (this.unidade && this.unidade.id) {
                App.SSE.connect([
                    `/unidades/${this.unidade.id}/painel`
                ]);
                App.SSE.onmessage = () => {
                    this.updatePanel();
                };
                App.SSE.ondisconnect = () => {
                    this.updatePanel();
                };
            }

            this.updatePanel();
        }
    });
})();
