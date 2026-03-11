/**
 * NovoSGA - Totem (autoatendimento)
 */
(function () {
    'use strict';

    var Impressao = {
        iframe: 'totem-print-frame',
        url(atendimento) {
            return App.url('/novosga.triage/imprimir/') + atendimento.id + '?_' + (new Date()).getTime();
        },
        imprimir(atendimento) {
            var iframe = document.getElementById(this.iframe);
            if (iframe) {
                iframe.src = this.url(atendimento);
                iframe.onload = function () {
                    iframe.contentWindow.print();
                };
            }
        }
    };

    new Vue({
        el: '#totem',
        data: {
            servicos: (servicos || []),
            prioridades: (prioridades || []),
            unidade: (unidade || {}),
            cliente: {
                nome: ''
            },
            step: 'services',
            selectedServico: null,
            atendimento: null,
            loading: false,
            resetTimeoutId: null,
        },
        computed: {
            servicosAtivos() {
                return this.servicos.filter((su) => su.ativo !== false);
            },
            prioridadesOrdenadas() {
                return this.prioridades.slice().sort((a, b) => (a.peso || 0) - (b.peso || 0));
            },
            prioridadeNormal() {
                return this.prioridades.find((p) => (p.peso || 0) === 0) || this.prioridades[0];
            }
        },
        methods: {
            selectServico(su) {
                this.selectedServico = su;
                if (this.prioridades.length <= 1) {
                    this.emitirSenha(this.prioridadeNormal);
                } else {
                    this.step = 'priorities';
                }
            },
            voltar() {
                this.step = 'services';
            },
            emitirSenha(prioridade) {
                if (this.loading || !this.selectedServico) {
                    return;
                }
                const nomeCliente = (this.cliente.nome || '').trim();
                this.loading = true;
                const data = {
                    servico: this.selectedServico.servico.id,
                    prioridade: prioridade.id,
                    cliente: null,
                };
                if (nomeCliente) {
                    const docCliente = this.buildDocumento();
                    data.cliente = {
                        nome: nomeCliente,
                        documento: docCliente,
                    };
                }

                App.ajax({
                    url: App.url('/novosga.triage/distribui_senha'),
                    type: 'post',
                    data: data,
                    success: (response) => {
                        this.atendimento = response.data;
                        Impressao.imprimir(this.atendimento);
                        this.step = 'ticket';
                        this.scheduleReset();
                    },
                    complete: () => {
                        this.loading = false;
                    }
                });
            },
            reprint() {
                if (this.atendimento) {
                    Impressao.imprimir(this.atendimento);
                }
            },
            reset() {
                this.atendimento = null;
                this.selectedServico = null;
                this.cliente = {
                    nome: ''
                };
                this.step = 'services';
                if (this.resetTimeoutId) {
                    clearTimeout(this.resetTimeoutId);
                    this.resetTimeoutId = null;
                }
            },
            scheduleReset() {
                if (this.resetTimeoutId) {
                    clearTimeout(this.resetTimeoutId);
                }
                this.resetTimeoutId = setTimeout(() => {
                    this.reset();
                }, 7000);
            },
            buildDocumento() {
                const rand = Math.floor(Math.random() * 9000) + 1000;
                return `TOTEM-${Date.now()}-${rand}`;
            }
        }
    });
})();
