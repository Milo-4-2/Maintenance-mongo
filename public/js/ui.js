// ============================================
// Views / UI Rendering
// All DOM rendering and HTML generation.
// Equivalent to View + Presenter in MVC.
// Never fetches data — receives it from app.js.
// ============================================

// --- Generic Renderers ---

// Render a list of items into a container, or show an empty state message
function renderList(containerId, tasks, cardFn, emptyTitle, emptyMsg) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if (!tasks.length) {
        el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--secondary);"><h3>${emptyTitle}</h3><p>${emptyMsg}</p></div>`;
        return;
    }
    tasks.forEach(t => el.appendChild(cardFn(t)));
}

// Update pagination controls (page info text, prev/next button states)
function updatePaginationUI(prefix, page, total) {
    const el = (s) => document.getElementById(prefix + s);
    const info = el('PageInfo'), prev = el('PrevPage'), next = el('NextPage'), wrap = el('Pagination');
    if (info) info.textContent = `Page ${page} of ${total}`;
    if (prev) prev.disabled = page === 1;
    if (next) next.disabled = page === total;
    if (wrap) wrap.classList.remove('hidden');
}

// --- Specific View Functions (delegate to generic renderList) ---
function renderTasks(tasks) { renderList('tasksContainer', tasks, createTaskCard, 'No tasks found', 'Create your first task to get started!'); }
function renderSubmitted(tasks) { renderList('submittedContainer', tasks, createSubmittedCard, 'No submitted tasks', 'Submit tasks to see them here'); }
function renderTrash(tasks) { renderList('trashContainer', tasks, createTrashCard, 'Trash is empty', 'No deleted tasks'); }

// Main task list uses different HTML IDs (lowercase), so it has its own pagination function
function updatePagination() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    document.getElementById('pagination').classList.remove('hidden');
}
function updateTrashPagination() { updatePaginationUI('trash', currentTrashPage, totalTrashPages); }         // Trash pagination
function updateSubmittedPagination() { updatePaginationUI('submitted', currentSubmittedPage, totalSubmittedPages); } // Submitted pagination

// --- Card Templates ---

// Helper: truncate description to 100 chars for card preview
function descSnippet(task) {
    return task.description ? `<p class="task-description">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>` : '';
}

// Create an active task card with status, priority, tags, subtask count, and action buttons
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = () => openTaskDetail(task._id);
    const echeance = task.echeance ? new Date(task.echeance).toLocaleDateString('en-US') : 'None';
    const tags = task.etiquettes?.length ? task.etiquettes.map(t => `<span class="tag">${t}</span>`).join('') : '';
    const stCount = task.sousTaches?.length || 0;
    const stDone = task.sousTaches ? task.sousTaches.filter(s => s.statut === 'terminée').length : 0;
    const assignCount = task.assignedTo?.length || 0;

    card.innerHTML = `
        <div class="task-card-header"><div>
            <h3 class="task-title">${escapeHtml(task.titre)}</h3>
            <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
            <span class="badge badge-priorite priorite-${task.priorite}">${PRIORITY_LABELS[task.priorite]}</span>
            ${task.submitted ? '<span class="badge" style="background:var(--success);color:white;">✓ Submitted</span>' : ''}
        </div></div>
        ${descSnippet(task)}
        ${task.categorie ? `<div class="task-meta"><span class="badge" style="background:var(--info);color:white;">${escapeHtml(task.categorie)}</span></div>` : ''}
        ${tags ? `<div class="task-tags">${tags}</div>` : ''}
        <div class="task-meta">
            ${stCount > 0 ? `<span class="badge" style="background:var(--success);color:white;">${stDone}/${stCount} subtasks</span>` : ''}
            ${assignCount > 0 ? `<span class="badge" style="background:var(--primary);color:white;">👥 ${assignCount} member${assignCount > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="task-footer">
            <div class="task-date"><div>Created: ${new Date(task.dateCreation).toLocaleDateString('en-US')}</div>${task.echeance ? `<div>Deadline: ${echeance}</div>` : ''}</div>
            <div class="task-actions" onclick="event.stopPropagation()">
                <button class="btn btn-success" onclick="submitTask('${task._id}')">Submit</button>
                <button class="btn btn-primary" onclick="editTask('${task._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        </div>`;
    return card;
}

// Create a submitted task card (read-only with view and unsubmit buttons)
function createSubmittedCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    const submittedAt = task.submittedAt ? new Date(task.submittedAt).toLocaleDateString('en-US') : 'Unknown';
    card.innerHTML = `
        <div class="task-card-header"><div>
            <h3 class="task-title">${escapeHtml(task.titre)}</h3>
            <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
            <span class="badge badge-priorite priorite-${task.priorite}">${PRIORITY_LABELS[task.priorite]}</span>
        </div></div>
        ${descSnippet(task)}
        <div class="task-footer">
            <div class="task-date"><div>Submitted: ${submittedAt}</div><div style="font-size:12px;color:var(--secondary);">By: ${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</div></div>
            <div class="task-actions">
                <button class="btn btn-info" onclick="viewSubmittedDetail('${task._id}')">View</button>
                <button class="btn btn-warning" onclick="unsubmitTask('${task._id}')">Unsubmit</button>
            </div>
        </div>`;
    return card;
}

// Create a trash card (shows who deleted it, restore/permanent delete for owners)
function createTrashCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    const deletedAt = task.deletedAt ? new Date(task.deletedAt).toLocaleDateString('en-US') : 'Unknown';
    const deletedByText = task.deletedBy ? (currentUser && task.deletedBy === currentUser.id ? 'You' : 'Another user') : 'Unknown';
    const isOwner = currentUser && task.createdBy === currentUser.id;
    card.innerHTML = `
        <div class="task-card-header"><div>
            <h3 class="task-title">${escapeHtml(task.titre)}</h3>
            <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
            <span class="badge badge-priorite priorite-${task.priorite}">${PRIORITY_LABELS[task.priorite]}</span>
        </div></div>
        ${descSnippet(task)}
        <div class="task-footer">
            <div class="task-date">
                <div>Deleted: ${deletedAt}</div>
                <div style="font-size:12px;color:var(--secondary);">Created by: ${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</div>
                <div style="font-size:12px;color:var(--danger);margin-top:3px;">🗑️ Deleted by: ${deletedByText}</div>
            </div>
            <div class="task-actions">
                ${isOwner ? `<button class="btn btn-success" onclick="restoreTask('${task._id}')">Restore</button><button class="btn btn-danger" onclick="permanentlyDeleteTask('${task._id}')">Delete Forever</button>` : `<span style="font-size:12px;color:var(--secondary);">Only creator can restore/delete</span>`}
            </div>
        </div>`;
    return card;
}

const DATE_OPTS = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

// Render member cards in the Members modal
function renderMembers(users) {
    const el = document.getElementById('membersContainer');
    if (!users.length) { el.innerHTML = '<p style="text-align:center;color:var(--secondary);">No members found</p>'; return; }
    el.innerHTML = users.map(u => `
        <div class="member-card">
            <div class="member-avatar">${escapeHtml(u.firstName[0])}${escapeHtml(u.lastName[0])}</div>
            <div class="member-info">
                <div class="member-name">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</div>
                <div class="member-username">@${escapeHtml(u.username)}</div>
                <div class="member-email">${escapeHtml(u.email)}</div>
            </div>
        </div>`).join('');
}

// Render the full task detail view inside the detail modal
function renderTaskDetail(task) {
    const fmtDate = d => new Date(d).toLocaleDateString('en-US', DATE_OPTS);
    const echeance = task.echeance ? fmtDate(task.echeance) : 'None';
    const tagsHtml = task.etiquettes?.length ? task.etiquettes.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '<span style="color:var(--secondary);font-style:italic;">No tags</span>';

    const subtasksHtml = task.sousTaches?.length
        ? task.sousTaches.map(st => `<div class="subtask-item"><div class="subtask-content"><div class="subtask-title">${escapeHtml(st.titre)}</div><span class="badge badge-statut">${STATUS_LABELS[st.statut]}</span>${st.echeance ? `<div style="font-size:12px;color:var(--secondary);margin-top:5px;">${new Date(st.echeance).toLocaleDateString('en-US')}</div>` : ''}</div><button class="btn btn-danger btn-sm" onclick="deleteSubtask('${task._id}','${st._id}')">Delete</button></div>`).join('')
        : '<div class="no-items">No subtasks</div>';

    const commentsHtml = task.commentaires?.length
        ? task.commentaires.map(c => `<div class="comment-item"><div class="comment-content"><div class="comment-author">${escapeHtml(c.auteur)}</div><div class="comment-text">${escapeHtml(c.texte)}</div><div class="comment-date">${fmtDate(c.date)}</div></div><button class="btn btn-danger btn-sm" onclick="deleteComment('${task._id}','${c._id}')">Delete</button></div>`).join('')
        : '<div class="no-items">No comments</div>';

    // Assigned users section with unassign buttons
    const assignedHtml = task.assignedTo?.length
        ? task.assignedTo.map(a => {
            const u = a.user;
            const name = u ? `${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}` : 'Unknown user';
            const uid = u ? (u._id || u) : a.user;
            return `<div class="assigned-item"><div class="assigned-info"><span class="member-avatar-sm">${u ? escapeHtml(u.firstName[0]) + escapeHtml(u.lastName[0]) : '??'}</span><span>${name}</span><span style="font-size:12px;color:var(--secondary);margin-left:8px;">Assigned ${new Date(a.assignedAt).toLocaleDateString('en-US')}</span></div><button class="btn btn-danger btn-sm" onclick="unassignUser('${task._id}','${uid}')">Remove</button></div>`;
        }).join('')
        : '<div class="no-items">No one assigned</div>';

    document.getElementById('taskDetail').innerHTML = `
        <h2>${escapeHtml(task.titre)}</h2>
        <div class="detail-section"><h3>General Information</h3><div class="detail-info">
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span></span></div>
            <div class="detail-item"><span class="detail-label">Priority</span><span class="detail-value"><span class="badge badge-priorite priorite-${task.priorite}">${PRIORITY_LABELS[task.priorite]}</span></span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${fmtDate(task.dateCreation)}</span></div>
            <div class="detail-item"><span class="detail-label">Deadline</span><span class="detail-value">${echeance}</span></div>
            ${task.categorie ? `<div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(task.categorie)}</span></div>` : ''}
        </div>
        ${task.description ? `<div class="detail-item" style="margin-top:15px;"><span class="detail-label">Description</span><p class="detail-value" style="margin-top:10px;">${escapeHtml(task.description)}</p></div>` : ''}
        <div class="detail-item" style="margin-top:15px;"><span class="detail-label">Tags</span><div style="margin-top:10px;">${tagsHtml}</div></div></div>
        <div class="detail-section"><h3>Author</h3><div class="detail-info">
            <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(task.auteur.email)}</span></div>
        </div></div>
        <div class="detail-section"><h3>Assigned Members</h3>${assignedHtml}
            <div class="assign-dropdown-wrap" style="margin-top:15px;">
                <input type="text" class="assign-search-input" id="assignSearchInput" placeholder="Type a name to assign..." autocomplete="off" onfocus="openAssignDropdown('${task._id}')" oninput="filterAssignDropdown()">
                <div class="assign-dropdown-list" id="assignDropdownList"></div>
            </div>
        </div>
        <div class="detail-section"><h3>Subtasks</h3>${subtasksHtml}<button class="btn btn-primary" style="margin-top:15px;" onclick="addSubtask('${task._id}')">Add Subtask</button></div>
        <div class="detail-section"><h3>Comments</h3>${commentsHtml}<button class="btn btn-primary" style="margin-top:15px;" onclick="addComment('${task._id}')">Add Comment</button></div>`;
}

// Render statistics dashboard with task counts by status and priority
function renderStats(stats) {
    const s = (val, color, label) => `<div class="stat-card"><div class="stat-value" style="color:${color};">${val || 0}</div><div class="stat-label">${label}</div></div>`;
    document.getElementById('statsContent').innerHTML = `<div class="stats-grid">
        ${s(stats.total, 'inherit', 'Total Tasks')}${s(stats.aFaire, 'var(--info)', 'To Do')}${s(stats.enCours, 'var(--warning)', 'In Progress')}
        ${s(stats.terminee, 'var(--success)', 'Completed')}${s(stats.annulee, 'var(--secondary)', 'Cancelled')}
        ${s(stats.prioriteBasse, 'var(--success)', 'Low Priority')}${s(stats.prioriteMoyenne, 'var(--warning)', 'Medium Priority')}
        ${s(stats.prioriteHaute, '#f97316', 'High Priority')}${s(stats.prioriteCritique, 'var(--danger)', 'Critical Priority')}
    </div>`;
}
