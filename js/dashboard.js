import { getTasks } from "./modules/tasks.js";
import { getHabits, getHabitStats, getPrayerChecklist } from "./modules/habits.js";
import { getNotes, getArchivedNotes } from "./modules/notes.js";

const $ = id => document.getElementById(id);
let range = "today";
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const dateLabel = date => new Date(date + "T12:00:00").toLocaleDateString("id-ID", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
const statusText = status => ({pending:"Belum dimulai",in_progress:"Sedang dikerjakan",completed:"Selesai"}[status] || status || "Belum dimulai");
const dateDiffDays = (a,b) => Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000);

async function refreshDashboard() {
    try {
        const [tasks, habits, notes, archivedNotes, prayers] = await Promise.all([
            getTasks(), getHabits(), getNotes(), getArchivedNotes(), getPrayerChecklist(today())
        ]);
        const activeTasks = tasks.filter(t => t.status !== "completed");
        const completedTasks = tasks.filter(t => t.status === "completed");
        const dueToday = activeTasks.filter(t => t.dueDate === today());
        const overdue = activeTasks.filter(t => t.dueDate && t.dueDate < today());
        const prayerDone = prayers.filter(p => p.completed).length;
        const habitStats = await Promise.all(habits.map(habit => getHabitStats(habit.id)));
        const personalHabitsDone = habitStats.filter(stat => stat.todayCompleted).length;
        const activeHabitCount = habits.length;
        const habitTotal = activeHabitCount + 5;
        const habitDone = prayerDone + personalHabitsDone;
        const noteCount = notes.length;
        const pinnedCount = notes.filter(n => n.isPinned).length;

        if ($("dashboard-date")) {
            $("dashboard-date").textContent = dateLabel(today());
            $("dashboard-day").textContent = new Date().toLocaleDateString("en-US", {weekday:"long"}).toUpperCase();
        }
        setText("dash-open-tasks", activeTasks.length);
        setText("dash-task-progress", `${completedTasks.length} completed`);
        setText("dash-due-today", dueToday.length);
        setText("dash-overdue", `${overdue.length} overdue`);
        setText("dash-habits-done", habitDone);
        setText("dash-habits-total", habitTotal);
        setText("dash-habit-caption", `${habitDone} of ${habitTotal} habits checked`);
        setText("dash-notes-total", noteCount);
        setText("dash-notes-pinned", `${pinnedCount} pinned notes`);
        setText("dash-habit-chip", `${activeHabitCount} habits`);
        setText("dash-note-chip", `${noteCount} notes`);
        setText("dash-task-chip", `${tasks.length} tasks`);
        const habitPercent = habitTotal ? Math.round(habitDone/habitTotal*100) : 0;
        setText("dash-habit-percent", `${habitPercent}%`);
        setWidth("dash-habit-progress", habitPercent);
        setWidth("dash-habit-preview-progress", habitPercent);
        setText("dash-habit-preview-text", `${habitDone} / ${habitTotal} daily habits completed`);
        setText("dash-note-pin-caption", `${archivedNotes.length} archived notes`);
        setText("dash-task-footer", `${completedTasks.length} completed · ${activeTasks.length} open`);

        const latest = notes[0];
        setText("dash-latest-note", latest ? latest.title : "Belum ada catatan tersimpan");
        setText("dash-latest-note-meta", latest ? `${latest.category || "General"}${latest.isPinned ? " · Pinned" : ""}` : "Mulai kumpulkan ide di Notes.");

        renderFocus(activeTasks, overdue, dueToday);
        renderTaskPreview(tasks);
        renderChart(tasks, range);
        setText("dash-chart-total", `${getRangeTasks(tasks, range).length} activities`);
    } catch (error) {
        console.error("Dashboard gagal diperbarui:", error);
        const focus = $("dashboard-focus-list");
        if (focus) focus.innerHTML = `<div class="focus-empty">Dashboard belum dapat memuat data. Coba refresh.</div>`;
    }
}
function setText(id, value) { const el=$(id); if(el) el.textContent=value; }
function setWidth(id, value) { const el=$(id); if(el) el.style.width=`${Math.max(0,Math.min(100,value))}%`; }
function getRangeTasks(tasks, selected) {
    if (selected === "today") return tasks.filter(t => (t.createdAt||"").slice(0,10) === today() || t.dueDate === today());
    const days=Number(selected); const start=new Date(); start.setDate(start.getDate()-(days-1)); start.setHours(0,0,0,0);
    return tasks.filter(t => { const date=t.createdAt ? new Date(t.createdAt) : null; return (date && date>=start) || (t.dueDate && t.dueDate>=start.toISOString().slice(0,10) && t.dueDate<=today()); });
}
function renderFocus(tasks, overdue, dueToday) {
    const box=$("dashboard-focus-list"); if(!box) return;
    const selected=[...overdue, ...dueToday, ...tasks.filter(t=>t.priority==="high" && !overdue.includes(t) && !dueToday.includes(t))].slice(0,4);
    if(!selected.length) { box.innerHTML=`<div class="focus-empty"><span class="focus-empty-icon">✦</span><strong>Clear runway</strong><span>Tidak ada tugas mendesak. Nikmati ruang untuk fokus.</span></div>`; return; }
    box.innerHTML=selected.map(task=>`<button type="button" class="focus-item" data-go="tasks-page"><span class="focus-item-mark ${task.priority||"medium"}"></span><span class="focus-item-copy"><strong>${escapeHTML(task.title)}</strong><small>${task.dueDate ? (task.dueDate<today()?"Overdue · ":task.dueDate===today()?"Due today · ":"Due · ")+escapeHTML(task.dueDate) : statusText(task.status)}</small></span><span class="focus-item-arrow">↗</span></button>`).join("");
}
function renderTaskPreview(tasks) {
    const box=$("dash-task-preview"); if(!box) return;
    const active=tasks.filter(t=>t.status!=="completed").slice(0,3);
    if(!active.length) { box.innerHTML=`<div class="task-preview-empty">${tasks.length?"All tasks completed — nice work!":"Your task list will appear here."}</div>`; return; }
    box.innerHTML=active.map(t=>`<div class="task-preview-row"><span class="task-preview-check ${t.status==="in_progress"?"working":""}">${t.status==="in_progress"?"↻":""}</span><span class="task-preview-name">${escapeHTML(t.title)}</span><span class="task-preview-priority ${t.priority||"medium"}">${escapeHTML(t.priority||"medium")}</span></div>`).join("");
}
function renderChart(tasks, selected) {
    const chart=$("dashboard-chart"); if(!chart) return;
    const now=new Date(); const days=selected==="today"?1:Number(selected); const dates=[];
    for(let i=days-1;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);}
    const counts=dates.map(date=>({date,created:tasks.filter(t=>(t.createdAt||"").slice(0,10)===date).length,done:tasks.filter(t=>t.status==="completed"&&(t.updatedAt||t.createdAt||"").slice(0,10)===date).length}));
    const max=Math.max(1,...counts.flatMap(c=>[c.created,c.done]));
    chart.innerHTML=counts.map((c,i)=>`<button type="button" class="chart-column" title="${c.date}: ${c.created} created, ${c.done} completed" aria-label="${c.date}: ${c.created} created, ${c.done} completed"><span class="chart-bars"><i class="bar-created" style="height:${Math.max(c.created?7:2,c.created/max*100)}%"></i><i class="bar-done" style="height:${Math.max(c.done?7:2,c.done/max*100)}%"></i></span><span class="chart-x-label">${selected==="today"?"Today":new Date(c.date+"T12:00:00").toLocaleDateString("id-ID",{day:"numeric",month:days>7?"short":undefined})}</span></button>`).join("");
    setText("dash-activity-subtitle", selected==="today"?"Aktivitas tugas hari ini":`Aktivitas tugas ${selected} hari terakhir`);
}
function navigate(page) {
    const button=document.querySelector(`.nav-item[data-page="${page}"]`);
    if(button) button.click();
    else if(page==="notes-page") { setTimeout(()=>document.querySelector('.nav-item[data-page="notes-page"]')?.click(),60); }
}
function handleAction(action) {
    if(action==="add-task") { navigate("tasks-page"); setTimeout(()=>$("task-title")?.focus(),120); }
    if(action==="add-habit") { navigate("habits-page"); setTimeout(()=>$("habit-name")?.focus(),120); }
    if(action==="add-note") { navigate("notes-page"); setTimeout(()=>$("notes-title")?.focus(),180); }
}
function setupDashboard() {
    document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.go)));
    document.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>handleAction(button.dataset.action)));
    document.querySelectorAll(".range-btn").forEach(button=>button.addEventListener("click",()=>{
        range=button.dataset.range;
        document.querySelectorAll(".range-btn").forEach(item=>item.classList.toggle("active",item===button));
        refreshDashboard();
    }));
    ["dashboard-refresh","dashboard-header-refresh"].forEach(id=>$(id)?.addEventListener("click",refreshDashboard));
    document.getElementById("main-navigation")?.addEventListener("click",event=>{
        const nav=event.target.closest(".nav-item"); if(nav?.dataset.page==="dashboard-page") setTimeout(refreshDashboard,0);
    });
    window.addEventListener("pwo:dashboard-refresh",refreshDashboard);
    refreshDashboard();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",setupDashboard,{once:true}); else setupDashboard();
