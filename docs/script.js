document.addEventListener('DOMContentLoaded', function() {
  let selectedAge = null;
  let selectedIncome = null;
  // Массив для хранения истории текущего диалога; при обновлении страницы он сбрасывается
  let conversationHistory = [];

  const selectionPage = document.getElementById('selectionPage');
  const chatBotDiv = document.getElementById('chatBot');
  const continueBtn = document.getElementById('continueBtn');
  const chatMessages = document.querySelector('.chat-messages');
  const chatInput = document.getElementById('chatInput');

  // Маппинг персонажей только по возрасту
  const personaMapping = {
    "18-24": "Антон",
    "25-34": "Мария",
    "35-44": "Олег",
    "45-54": "Наталья",
    "55+": "Елена"
  };

  // Маппинг аватаров — теперь зависят только от возраста
  const avatarMapping = {
    "18-24": "avatars/anton.png",
    "25-34": "avatars/maria.png",
    "35-44": "avatars/oleg.png",
    "45-54": "avatars/natalia.png",
    "55+": "avatars/elena.png"
  };

  // Обработка выбора возраста и дохода — все кнопки имеют класс option-btn
  const optionButtons = document.querySelectorAll('.option-btn');
  optionButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (this.dataset.age) {
        selectedAge = this.getAttribute('data-age');
        document.querySelectorAll('.option-btn[data-age]').forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
        console.log('Выбран возраст:', selectedAge);
      }
      if (this.dataset.income) {
        selectedIncome = this.getAttribute('data-income');
        document.querySelectorAll('.option-btn[data-income]').forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
        console.log('Выбран доход:', selectedIncome);
      }
      if (selectedAge && selectedIncome) {
        continueBtn.disabled = false;
      }
    });
  });

  // При нажатии "Перейти к диалогу" переключаем экран с анимацией
  continueBtn.addEventListener('click', function() {
    selectionPage.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
      selectionPage.style.display = 'none';
      selectionPage.style.animation = '';
      chatBotDiv.style.display = 'block';
      chatBotDiv.style.animation = 'fadeIn 0.5s forwards';
    }, 500);
  });

  // Обработка отправки сообщений
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keyup', function(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '') return;
    
    // Добавляем сообщение пользователя в область чата и в историю
    const userMessageElem = document.createElement('div');
    userMessageElem.classList.add('chat-message', 'user-message');
    userMessageElem.innerHTML = `<div class="message-content">Вы: ${messageText}</div>`;
    chatMessages.appendChild(userMessageElem);
    conversationHistory.push({ role: "user", content: messageText });
    
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Определяем имя персонажа по выбранному возрасту (по умолчанию "Антон")
    const senderName = personaMapping[selectedAge] || "Антон";
    
    // Добавляем индикатор "печатает..." с именем персонажа
    const typingElem = document.createElement('div');
    typingElem.classList.add('chat-message', 'bot-message', 'typing-indicator');
    typingElem.innerHTML = `<div class="message-content">${senderName} печатает<span class="dots"></span></div>`;
    chatMessages.appendChild(typingElem);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Отправляем запрос на сервер
    fetch('/api/chat', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        age: selectedAge || "18-24",
        income: selectedIncome || "До 100к",
        history: conversationHistory
      })
    })
    .then(response => response.json())
    .then(data => {
      const replyText = data.reply;
      
      // Вычисляем задержку в зависимости от длины ответа: базовая задержка 1000 мс + 15 мс за каждый символ, максимум 5000 мс.
      const baseDelay = 1000;
      const factor = 15;
      let computedDelay = baseDelay + replyText.length * factor;
      const delay = Math.min(computedDelay, 5000);
      
      setTimeout(() => {
        chatMessages.removeChild(typingElem);
        
        // Определяем аватар по выбранному возрасту
        const avatarUrl = avatarMapping[selectedAge] || "https://via.placeholder.com/40";
        
        // Создаем элемент с ответом бота, выводим имя (без "печатает") и ответ
        const replyElem = document.createElement('div');
        replyElem.classList.add('chat-message', 'bot-message');
        replyElem.innerHTML = `
          <img class="avatar" src="${avatarUrl}" alt="avatar">
          <div class="message-content"><span class="sender-name">${senderName}:</span> ${replyText}</div>
        `;
        chatMessages.appendChild(replyElem);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        conversationHistory.push({ role: "assistant", content: replyText });
      }, delay);
    })
    .catch(error => {
      chatMessages.removeChild(typingElem);
      const errorElem = document.createElement('div');
      errorElem.classList.add('chat-message', 'bot-message');
      errorElem.innerHTML = `<div class="message-content">Ошибка: ${error}</div>`;
      chatMessages.appendChild(errorElem);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // Анимация мерцающих точек для индикатора печати
  setInterval(() => {
    const dots = document.querySelectorAll('.typing-indicator .dots');
    dots.forEach(dotElem => {
      const curr = dotElem.textContent;
      if (curr.length >= 3) {
        dotElem.textContent = '';
      } else {
        dotElem.textContent += '.';
      }
    });
  }, 500);

  // Обработка кнопки возврата к выбору
  const returnBtn = document.getElementById('returnBtn');
  returnBtn.addEventListener('click', function() {
    chatBotDiv.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
      chatBotDiv.style.display = 'none';
      chatBotDiv.style.animation = '';
      selectionPage.style.display = 'block';
      selectionPage.style.animation = 'fadeIn 0.5s forwards';
      continueBtn.disabled = true;
      selectedAge = null;
      selectedIncome = null;
      conversationHistory = [];  // сбрасываем историю диалога
      document.querySelectorAll('.option-btn.selected').forEach(btn => btn.classList.remove('selected'));
      chatMessages.innerHTML = '';  // очищаем область сообщений
    }, 500);
  });

  // Добавляем динамически анимацию fadeOut, если необходимо
  const styleElem = document.createElement('style');
  styleElem.innerHTML = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(styleElem);
});
