// ======================================================
// 1. 引入并配置 Supabase
// ======================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// !!! 请确保这里的 URL 和 Key 是您自己的，并且用英文单引号包起来 !!!
const SUPABASE_URL = 'https://qdugzdyeioanqosrhdga.supabase.co'; // 把这里换成你的
const SUPABASE_ANON_KEY = 'sb_publishable_HbvZh0CuBxiQaPuLxVd7hw_NIp4yD7n'; // 把这里换成你的

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ======================================================
// 通用逻辑：根据当前页面路径，执行不同的函数
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('index.html') || path.endsWith('/')) {
        handleAuthPage();
    } else if (path.includes('register.html')) {
        handleAuthPage(); // 注册页和登录页使用同一个处理函数
    } else if (path.includes('dashboard.html')) {
        handleDashboardPage();
    } else if (path.includes('admin.html')) {
        handleAdminPage();
    }
});


// ======================================================
// 1. 登录/注册页面 (index.html, register.html) 的逻辑
// ======================================================
function handleAuthPage() {
    // 注册逻辑
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                alert('注册失败: ' + error.message);
            } else {
                alert('注册成功！请前往登录页面登录。\n(如果开启了邮件验证，请先前往邮箱激活账号)');
                window.location.href = 'index.html'; 
            }
        });
    }

    // 登录逻辑
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                alert('登录失败: ' + error.message);
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
}

// ======================================================
// 2. 任务面板页面 (dashboard.html) 的逻辑 (V5.0 双模式)
// ======================================================
async function handleDashboardPage() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        alert('请先登录！');
        window.location.href = 'index.html';
        return;
    }

    const user = session.user;
    document.getElementById('user-email').textContent = user.email;

    const allTasksListElement = document.getElementById('all-tasks-list');
    const myTasksListElement = document.getElementById('my-tasks-list');
    const allTasksFilter = document.getElementById('all-tasks-filter');
    const myTasksFilter = document.getElementById('my-tasks-filter');

    let allTasks = [];
    let myTasks = [];

    // --- 渲染函数 ---
    function renderAllTasks(filter = 'all') {
        const filteredTasks = (filter === 'all') ? allTasks : allTasks.filter(t => t.status.includes(filter));
        const hasPendingTask = myTasks.some(t => t.status === '已领取');

        if (filteredTasks.length === 0) {
            allTasksListElement.innerHTML = '<p class="text-muted">暂无符合条件的任务。</p>';
            return;
        }

        let html = '<ul class="list-group">';
        filteredTasks.forEach(task => {
            let buttonOrBadge = '';
            if (task.status === '未领取') {
                const disabled = hasPendingTask ? 'disabled' : '';
                const tooltip = hasPendingTask ? 'title="请先完成您已领取的任务"' : '';
                buttonOrBadge = `<button class="btn btn-primary btn-sm claim-btn" data-task-id="${task.id}" ${disabled} ${tooltip}>领取</button>`;
            } else {
                buttonOrBadge = `<span class="badge bg-secondary">已被领取</span>`;
            }
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">${task.title}${buttonOrBadge}</li>`;
        });
        html += '</ul>';
        allTasksListElement.innerHTML = html;
        
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    function renderMyTasks(filter = 'all') {
        const filteredTasks = (filter === 'all') ? myTasks : myTasks.filter(t => t.status === filter);
        if (filteredTasks.length === 0) {
            myTasksListElement.innerHTML = '<p class="text-muted">暂无符合条件的任务。</p>';
            return;
        }
        
        let html = '<div class="accordion">';
        filteredTasks.forEach((task, index) => {
            const isPending = task.status === '已领取';
            const isCompleted = task.status === '已回填';
            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${index}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                            ${task.title} <span class="badge ms-2 bg-${isPending ? 'warning text-dark' : (isCompleted ? 'success' : 'secondary')}">${task.status}</span>
                        </button>
                    </h2>
                    <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}">
                        <div class="card-body border-top">
                            <p><strong>链接:</strong> ${task.link}</p>
                            <button class="btn btn-outline-secondary btn-sm me-2 copy-btn" data-text="${task.title}">复制名称</button>
                            <button class="btn btn-outline-secondary btn-sm copy-btn" data-text="${task.link}">复制链接</button>
                            <hr>
                            ${isPending ? `
                                <div class="mb-3">
                                    <label for="submission-${task.id}" class="form-label fw-bold">回填内容:</label>
                                    <textarea class="form-control" id="submission-${task.id}" rows="3" placeholder="请在此处填写回填内容，如截图链接等..."></textarea>
                                </div>
                                <button class="btn btn-success submit-btn" data-task-id="${task.id}">提交回填</button>
                            ` : `
                                <p class="fw-bold">回填内容:</p>
                                <p class="bg-light p-2 rounded">${task.submitted_content || '无'}</p>
                                <p class="text-muted small">完成于: ${new Date(task.submitted_at).toLocaleString()}</p>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        myTasksListElement.innerHTML = html;
    }

    // --- 数据加载与事件处理 ---
    async function loadAndRenderAll() {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
        if (error) {
            console.error('加载任务失败:', error);
            allTasksListElement.innerHTML = `<div class="alert alert-danger">加载任务失败: ${error.message}</div>`;
            return;
        }
        
        // 任务中心只显示公共任务 (is_private 为 false)
        allTasks = data.filter(t => t.is_private === false);
        
        // 我的任务包括 (我领取的公共任务) + (直接指派给我的私人任务)
        myTasks = data.filter(t => t.user_id === user.id);
        
        renderAllTasks(allTasksFilter.value);
        renderMyTasks(myTasksFilter.value);
        addEventListeners();
    }

    function addEventListeners() {
        allTasksFilter.onchange = () => renderAllTasks(allTasksFilter.value);
        myTasksFilter.onchange = () => renderMyTasks(myTasksFilter.value);
        
        document.querySelectorAll('.copy-btn').forEach(b => {
            b.onclick = (e) => {
                navigator.clipboard.writeText(e.target.dataset.text).then(() => alert('已复制!'));
            };
        });

        document.querySelectorAll('.claim-btn:not([disabled])').forEach(b => {
            b.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('确定领取此任务？')) {
                    const { error } = await supabase.from('tasks').update({ status: '已领取', claimed_at: new Date(), user_id: user.id }).eq('id', e.target.dataset.taskId);
                    if (error) {
                        alert('领取失败: ' + error.message);
                    } else { 
                        alert('领取成功!'); 
                        await loadAndRenderAll(); 
                    }
                }
            };
        });

        document.querySelectorAll('.submit-btn').forEach(b => {
            b.onclick = async (e) => {
                e.stopPropagation();
                const taskId = e.target.dataset.taskId;
                const content = document.getElementById(`submission-${taskId}`).value;
                if (!content.trim()) { 
                    alert('回填内容不能为空!'); 
                    return; 
                }
                const { error } = await supabase.from('tasks').update({ status: '已回填', submitted_content: content, submitted_at: new Date() }).eq('id', taskId);
                if (error) {
                    alert('回填失败: ' + error.message);
                } else { 
                    alert('回填成功!'); 
                    await loadAndRenderAll(); 
                }
            };
        });
    }

    loadAndRenderAll();

    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

// ======================================================
// 3. 管理员页面 (admin.html) 的逻辑 (V6.0 管理后台)
// ======================================================
async function handleAdminPage() {
    // --- 1. 发布任务逻辑 (和V5.0一样) ---
    const addTaskForm = document.getElementById('add-task-form');
    if (addTaskForm) {
        const userIdWrapper = document.getElementById('user-id-wrapper');
        const userIdInput = document.getElementById('user-id');
        document.querySelectorAll('input[name="taskType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'private') {
                    userIdWrapper.style.display = 'block';
                    userIdInput.required = true;
                } else {
                    userIdWrapper.style.display = 'none';
                    userIdInput.required = false;
                }
            });
        });
        addTaskForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('task-title').value;
            const link = document.getElementById('task-link').value;
            const taskType = document.querySelector('input[name="taskType"]:checked').value;
            const messageEl = document.getElementById('admin-message');
            let taskData = { title, link };
            let errorMessage = '';
            if (taskType === 'private') {
                const userId = userIdInput.value;
                if (!userId.trim()) { errorMessage = '指派模式下，用户ID不能为空！'; } 
                else {
                    taskData.is_private = true;
                    taskData.user_id = userId;
                    taskData.status = '已领取';
                    taskData.claimed_at = new Date();
                }
            } else { taskData.is_private = false; }
            if (errorMessage) { messageEl.textContent = errorMessage; messageEl.className = 'mt-3 alert alert-danger'; return; }
            const { error } = await supabase.from('tasks').insert([taskData]);
            if (error) { messageEl.textContent = '发布失败: ' + error.message; messageEl.className = 'mt-3 alert alert-danger'; } 
            else {
                messageEl.textContent = '任务发布成功！';
                messageEl.className = 'mt-3 alert alert-success';
                addTaskForm.reset();
                userIdWrapper.style.display = 'none';
                userIdInput.required = false;
                loadTaskRecords(); // 发布成功后刷新任务记录
            }
        });
    }

    // --- 2. 加载任务记录逻辑 ---
    const taskRecordsTbody = document.getElementById('task-records-tbody');
    async function loadTaskRecords() {
        if (!taskRecordsTbody) return;
        taskRecordsTbody.innerHTML = '<tr><td colspan="5">加载中...</td></tr>';
        
        // 我们需要关联查询，获取到用户的邮箱
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`*, user_profile:profiles(user_email:auth_users(email))`) // 这是一个简单的关联查询示例，可能需要调整
            .order('created_at', { ascending: false });

        if (error || !tasks) {
            taskRecordsTbody.innerHTML = `<tr><td colspan="5" class="text-danger">加载失败: ${error?.message}</td></tr>`;
            return;
        }

        taskRecordsTbody.innerHTML = '';
        tasks.forEach(task => {
            // 注意：因为RLS，直接关联auth.users可能受限，我们先显示ID，后续可优化
            const userIdentifier = task.user_id ? task.user_id.substring(0, 8) + '...' : 'N/A';
            const row = `
                <tr>
                    <td>${task.title}</td>
                    <td><span class="badge bg-info text-dark">${task.status}</span></td>
                    <td>${userIdentifier}</td>
                    <td>${task.submitted_content || '无'}</td>
                    <td>${new Date(task.created_at).toLocaleString()}</td>
                </tr>
            `;
            taskRecordsTbody.innerHTML += row;
        });
    }

    // --- 3. 加载和管理用户逻辑 ---
    const userListTbody = document.getElementById('user-list-tbody');
    async function loadUsers() {
        if (!userListTbody) return;
        userListTbody.innerHTML = '<tr><td colspan="4">加载中...</td></tr>';
        
        // Supabase 的限制，不能直接从客户端查询 auth.users，但可以查询我们自己创建的 profiles 表
        // 同时关联查询出用户的邮箱
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`id, is_banned, user_info:id(email, created_at)`);

        if (error || !profiles) {
            userListTbody.innerHTML = `<tr><td colspan="4" class="text-danger">加载用户失败: ${error?.message}</td></tr>`;
            return;
        }

        userListTbody.innerHTML = '';
        profiles.forEach(profile => {
            const isBanned = profile.is_banned;
            const buttonText = isBanned ? '解封' : '拉黑';
            const buttonClass = isBanned ? 'btn-success' : 'btn-danger';
            const statusBadge = isBanned ? '<span class="badge bg-danger">已拉黑</span>' : '<span class="badge bg-success">正常</span>';
            
            const row = `
                <tr>
                    <td>${profile.user_info.email}</td>
                    <td>${new Date(profile.user_info.created_at).toLocaleString()}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn ${buttonClass} btn-sm ban-btn" data-user-id="${profile.id}" data-is-banned="${isBanned}">
                            ${buttonText}
                        </button>
                    </td>
                </tr>
            `;
            userListTbody.innerHTML += row;
        });

        // 为所有拉黑/解封按钮添加事件监听
        document.querySelectorAll('.ban-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userId;
                const currentIsBanned = e.target.dataset.isBanned === 'true';
                const actionText = currentIsBanned ? '解封' : '拉黑';
                
                if (confirm(`确定要${actionText}这个用户吗？`)) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ is_banned: !currentIsBanned })
                        .eq('id', userId);
                    
                    if (error) {
                        alert(`${actionText}失败: ${error.message}`);
                    } else {
                        alert(`用户已成功${actionText}！`);
                        loadUsers(); // 刷新用户列表
                    }
                }
            });
        });
    }

    // --- 4. 页面加载时初始化 ---
    loadTaskRecords();
    loadUsers();

    // 当切换到对应标签页时，也刷新一下数据
    document.getElementById('records-tab')?.addEventListener('click', loadTaskRecords);
    document.getElementById('users-tab')?.addEventListener('click', loadUsers);
}