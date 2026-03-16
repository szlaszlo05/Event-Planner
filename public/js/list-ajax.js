document.querySelectorAll('.ajax-trigger').forEach((title) => {
  title.addEventListener('click', async (e) => {
    const card = e.target.closest('.event_card');
    const eventId = card.dataset.id;
    const infoSection = document.getElementById(`info-${eventId}`);

    try {
      const response = await fetch(`/api/events/info/${eventId}`);
      const data = await response.json();

      infoSection.textContent = '';

      const fields = [
        { label: 'Location', value: data.Location },
        { label: 'StartTime', value: data.StartTime },
        { label: 'EndTime', value: data.EndTime },
      ];

      fields.forEach((field) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${field.label}: `;
        p.appendChild(strong);
        p.append(document.createTextNode(field.value));
        infoSection.appendChild(p);
      });
    } catch (error) {
      console.error(`Error while fetching more info: ${error.message}`);
    }
  });
});

document.querySelectorAll('.delete-photo-button').forEach((button) => {
  button.addEventListener('click', async (e) => {
    const pictureID = e.target.dataset.id;
    const messageSection = document.getElementById('ajax-message');

    if (!confirm('Are you sure you want to delete this picture?')) return;

    try {
      const response = await fetch(`/api/events/pictures/${pictureID}`, { method: 'DELETE' });
      const result = await response.json();

      messageSection.textContent = result.message;
      messageSection.style.display = 'block';

      if (response.ok) {
        messageSection.className = 'alert success';
        const photoItem = document.getElementById(`pic-${pictureID}`);
        if (photoItem) photoItem.remove();
      } else {
        messageSection.className = 'alert error';
      }
    } catch (error) {
      messageSection.textContent = 'Network Error: Could not contact server';
      messageSection.className = 'alert error';
      console.error('Delete failed', error);
    }
  });
});
