document.addEventListener('DOMContentLoaded', () => {
    const taskId = window.location.pathname.split('/')[2];

    fetch(`/tasks/${taskId}`)
        .then(response => response.json())
        .then(task => {
            const taskDetails = document.getElementById('taskDetails');
            taskDetails.innerHTML = `
                <p><strong>ID:</strong> ${task.id}</p>
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Description:</strong> ${task.description}</p>
            `;
        });
});