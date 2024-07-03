document.addEventListener('DOMContentLoaded', () => {
    const taskId = window.location.pathname.split('/')[2];
    document.getElementById('taskId').value = taskId;

    fetch(`/tasks/${taskId}`)
        .then(response => response.json())
        .then(task => {
            document.getElementById('title').value = task.title;
            document.getElementById('description').value = task.description;
        });

    document.getElementById('editTaskForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;

        fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        })
        .then(response => response.json())
        .then(task => {
            window.location.href = '/';
        });
    });
});