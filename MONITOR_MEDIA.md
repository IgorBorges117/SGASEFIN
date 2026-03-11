# Instruções de mídia para o Monitor

Este arquivo explica como configurar a mídia exibida no monitor (vídeo/TV) usando parâmetros na URL.

## URL base do monitor

Exemplo local:

```
http://127.0.0.1:8000/novosga.monitor
```

## Parâmetros suportados

- `src`: URL completa para um iframe (YouTube, Globoplay, IPTV etc.)
- `tv`: ID de vídeo do YouTube (11 caracteres)
- `media`: caminho de arquivo local de vídeo (`.mp4` ou `.webm`)
- `autoplay`: `1` ou `0` (padrão `1`)
- `mute`: `1` ou `0` (padrão `0`)
- `controls`: `1` ou `0` (padrão `1`)
- `loop`: `1` ou `0` (padrão `1`, só afeta vídeo local)

Observação: para autoplay funcionar em navegadores, o vídeo precisa estar em `mute=1`.

## 1) YouTube (vídeo único)

Use `tv` com o ID do vídeo:

```
http://127.0.0.1:8000/novosga.monitor?tv=VIDEO_ID&autoplay=1&mute=1&controls=0
```

## 2) YouTube (playlist automática)

Use `src` com a URL de playlist embed:

```
http://127.0.0.1:8000/novosga.monitor?src=https://www.youtube.com/embed/videoseries?list=PLAYLIST_ID&autoplay=1&mute=1&loop=1&playlist=PLAYLIST_ID&controls=0&rel=0&modestbranding=1&playsinline=1
```

Notas:
- `loop=1` só funciona com `playlist=PLAYLIST_ID`.
- O parâmetro `src` deve estar completo (o sistema não adiciona parâmetros automaticamente).

## 3) IPTV (URL direta)

Se você tiver uma URL de player/iframe para IPTV, use `src`:

```
http://127.0.0.1:8000/novosga.monitor?src=https://SEU-ENDERECO-DO-PLAYER&autoplay=1&mute=1&controls=0
```

Importante:
- O monitor só aceita `src` que comece com `https://` (regra de segurança).
- Se o player for `http://`, você precisará habilitar HTTPS ou ajustar o código.

## 4) Vídeo local (MP4/WebM)

Coloque o arquivo em `public/media` (por exemplo `public/media/aguarde.mp4`) e use `media`:

```
http://127.0.0.1:8000/novosga.monitor?media=media/aguarde.mp4&autoplay=1&mute=1&loop=1&controls=0
```

Notas:
- O parâmetro `media` aceita apenas `mp4` ou `webm`.
- O caminho é relativo à pasta `public/`.

