<script>
  export let titulo = '';
  export let url = '';

  // Función para compartir en Facebook
  function compartirFacebook() {
    const urlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(urlFacebook, '_blank', 'width=600,height=400');
  }

  // Función para compartir en Twitter
  function compartirTwitter() {
    const textoTweet = `${titulo} - ¡Aprende acordeón vallenato!`;
    const urlTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoTweet)}&url=${encodeURIComponent(url)}`;
    window.open(urlTwitter, '_blank', 'width=600,height=400');
  }

  // Función para compartir en WhatsApp
  function compartirWhatsApp() {
    const mensaje = `¡Mira este artículo sobre acordeón vallenato! ${titulo} ${url}`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
  }
</script>

<div class="botones-sociales">
  <button aria-label="Compartir en Facebook" on:click={compartirFacebook}>
    👍
  </button>
  <button aria-label="Compartir en Twitter" on:click={compartirTwitter}>
    🐦
  </button>
  <button aria-label="Compartir en WhatsApp" on:click={compartirWhatsApp}>
    💬
  </button>
</div>

<style>
.botones-sociales {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.botones-sociales button {
  background: #eafbe6;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.botones-sociales button:hover {
  background: #4CAF50;
  color: #fff;
  transform: scale(1.13) translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
}

.botones-sociales button:nth-child(1):hover {
  background: #1877f2; /* Color Facebook */
}

.botones-sociales button:nth-child(2):hover {
  background: #1da1f2; /* Color Twitter */
}

.botones-sociales button:nth-child(3):hover {
  background: #25d366; /* Color WhatsApp */
}

/* === RESPONSIVE MOBILE === */
@media (max-width: 700px) {
  .botones-sociales {
    gap: 10px;
    margin-bottom: 15px;
  }

  .botones-sociales button {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }
}
</style> 