document.addEventListener('DOMContentLoaded', function() {
  const ageButtons = document.querySelectorAll('.age-btn');
  const ageSelectionDiv = document.getElementById('ageSelection');
  const chatBotDiv = document.getElementById('chatBot');
  let selectedAge = null;  // сохранение выбранного возраста

  // Обработка клика по кнопке выбора возраста
  ageButtons.forEach(button => {
    button.addEventListener('click', function() {
      selectedAge = this.getAttribute('data-age');
      console.log('Выбран возраст:', selectedAge);
      transitionToChat();
    });
  });

  // Функция перехода на страницу чат-бота
  function transitionToChat() {
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

  // Логика работы чата
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

    // Выводим сообщение пользователя
    const messageElem = document.createElement('div');
    messageElem.textContent = "Вы: " + messageText;
    messageElem.classList.add('chat-message');
    chatMessages.appendChild(messageElem);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Отправляем запрос к бекенду на адрес /api/chat
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: messageText,
        age: selectedAge || "18-24"  // если возраст не выбран, используем значение по умолчанию
      })
    })
    .then(response => response.json())
    .then(data => {
      const replyElem = document.createElement('div');
      replyElem.textContent = "Альфа чат-бот: " + data.reply;
      replyElem.classList.add('chat-reply');
      chatMessages.appendChild(replyElem);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(error => {
      const errorElem = document.createElement('div');
      errorElem.textContent = "Ошибка: " + error;
      errorElem.classList.add('chat-reply');
      chatMessages.appendChild(errorElem);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
});
