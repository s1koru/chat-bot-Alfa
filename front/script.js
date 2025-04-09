document.addEventListener('DOMContentLoaded', function() {
    const ageButtons = document.querySelectorAll('.age-btn');
    const ageSelectionDiv = document.getElementById('ageSelection');
    const chatBotDiv = document.getElementById('chatBot');
  
    // Обработка клика по кнопке выбора возраста
    ageButtons.forEach(button => {
      button.addEventListener('click', function() {
        const selectedAge = this.getAttribute('data-age');
        console.log('Выбран возраст:', selectedAge);
        transitionToChat();
      });
    });
  
    // Функция перехода на страницу чат-бота
    function transitionToChat() {
      // Запускаем анимацию исчезновения для выбора возраста
      ageSelectionDiv.style.animation = 'fadeOut 0.5s forwards';
      
      setTimeout(() => {
        ageSelectionDiv.style.display = 'none';
        chatBotDiv.style.display = 'block';
      }, 500);
    }
  
    // Добавление анимации fadeOut через динамическое подключение стилей
    const styleElem = document.createElement('style');
    styleElem.innerHTML = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styleElem);
  
    // Логика чата
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.querySelector('.chat-messages');
  
    sendBtn.addEventListener('click', sendMessage);
  
    chatInput.addEventListener('keyup', function(event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
  
    function sendMessage() {
      const messageText = chatInput.value.trim();
      if (messageText === '') return;
  
      // Создаем элемент для сообщения пользователя
      const messageElem = document.createElement('div');
      messageElem.textContent = "Вы: " + messageText;
      messageElem.classList.add('chat-message');
      chatMessages.appendChild(messageElem);
  
      // Очищаем поле ввода и скроллим чат вниз
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
  
      // Пример ответа чат-бота (здесь можно добавить реальную логику ответа)
      setTimeout(() => {
        const replyElem = document.createElement('div');
        replyElem.textContent = "Alpha ChatBot: Спасибо за ваше сообщение!";
        replyElem.classList.add('chat-reply');
        chatMessages.appendChild(replyElem);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 500);
    }
  });
  