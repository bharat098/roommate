// roommate-manager.js

let users = {
    'Bharat': { pin: '1234', phone: '8917361050' },
    'Soumya': { pin: '2345', phone: '8984765656' },
    'Debasis': { pin: '3456', phone: '7978403827' }
  };
  
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  let chores = JSON.parse(localStorage.getItem('chores')) || [];
  let deletedItems = JSON.parse(localStorage.getItem('deletedItems')) || [];
  let currentUser = '';
  
  $(document).ready(() => {
    $('#loginModal').modal('show');
    refreshUserDropdowns();
    $('#expenseTable').DataTable();
    updateTable();
    updateSummary();
    updateChart();
    updateChoreList();
    updateHistory();
  });
  
  function refreshUserDropdowns() {
    const selects = ['#payer', '#chorePerson', '#resetUser'];
    const options = Object.keys(users).map(u => `<option>${u}</option>`).join('');
    selects.forEach(sel => $(sel).html(options));
    $('#userSelect').html(options);
  }
  
  function loginUser() {
    const user = $('#userSelect').val();
    const pin = $('#userPin').val();
    const newUser = $('#newRoommate').val();
    const newPhone = $('#newPhone').val();
    const newPin = $('#userPinNew').val();
  
    if (newUser && newPin && newPhone) {
      if (!users[newUser]) {
        users[newUser] = { pin: newPin, phone: newPhone };
        currentUser = newUser;
        refreshUserDropdowns();
      }
    } else if (users[user]?.pin === pin) {
      currentUser = user;
    } else {
      alert('Invalid login');
      return;
    }
  
    $('#loginModal').modal('hide');
    $('#adminResetSection').toggle(currentUser === 'Bharat');
    updateTable();
    updateSummary();
    updateChart();
    updateChoreList();
    updateHistory();
  }
  
  function logoutUser() {
    currentUser = '';
    $('#loginModal').modal('show');
  }
  
  function resetPin() {
    if (currentUser !== 'Bharat') return;
    const user = $('#resetUser').val();
    const newPin = $('#newPin').val();
    users[user].pin = newPin;
    alert(`PIN reset for ${user}`);
  }
  
  function addEntry() {
    const payer = $('#payer').val();
    let amount = parseFloat($('#amount').val());
    const reason = $('#reason').val();
    const type = $('#entryType').val();
    const date = $('#entryDate').val();
    const isSplit = $('#splitAmount').is(':checked');
  
    if (!payer || !amount || !reason || !type || !date) return alert('Fill all fields');
  
    if (isSplit && type === 'expense') {
      const each = amount / Object.keys(users).length;
      Object.keys(users).forEach(user => {
        entries.push({ payer, amount: each, reason: `${reason} (split)`, type, date });
      });
    } else {
      entries.push({ payer, amount, reason, type, date });
    }
  
    localStorage.setItem('entries', JSON.stringify(entries));
    updateTable();
    updateSummary();
    updateChart();
  }
  
  function deleteEntry(index) {
    const reason = prompt('Why do you want to delete this record?');
    if (reason) {
      const removed = entries.splice(index, 1)[0];
      deletedItems.push({ ...removed, deletedBy: currentUser, deletedReason: reason, deletedAt: new Date().toLocaleString() });
      localStorage.setItem('entries', JSON.stringify(entries));
      localStorage.setItem('deletedItems', JSON.stringify(deletedItems));
      updateTable();
      updateSummary();
      updateChart();
      updateHistory();
    }
  }
  
  function updateTable() {
    const table = $('#expenseTable').DataTable();
    table.clear();
    entries.forEach((e, i) => {
      table.row.add([
        e.payer, e.amount.toFixed(2), e.reason, e.type, e.date,
        currentUser === 'Bharat' ? `<button class='btn btn-sm btn-danger' onclick='deleteEntry(${i})'>🗑️</button>` : ''
      ]);
    });
    table.draw();
  }
  
  function updateSummary() {
    const summary = {};
    Object.keys(users).forEach(u => summary[u] = 0);
  
    entries.forEach(e => {
      if (e.type === 'expense') summary[e.payer] -= e.amount;
      else summary[e.payer] += e.amount;
    });
  
    let html = '<ul class="list-group">';
    for (let user in summary) {
      html += `<li class="list-group-item d-flex justify-content-between">${user}<span>${summary[user].toFixed(2)}</span></li>`;
    }
    html += '</ul>';
    $('#summary').html(html);
  }
  
  function updateChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
  
    const data = {};
    entries.forEach(e => {
      if (!data[e.payer]) data[e.payer] = 0;
      data[e.payer] += e.type === 'expense' ? e.amount : -e.amount;
    });
  
    if (Object.keys(data).length === 0) return;
    if (window.expenseChart) window.expenseChart.destroy();
  
    window.expenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Net Contribution',
          data: Object.values(data),
          backgroundColor: ['rgba(255,99,132,0.6)', 'rgba(54,162,235,0.6)', 'rgba(255,206,86,0.6)', 'rgba(75,192,192,0.6)']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Roommate Expense Overview' }
        }
      }
    });
  }
  
  function addChoreSchedule() {
    const person = $('#chorePerson').val();
    const type = $('#choreType').val();
    const date = $('#choreDate').val();
    const repeat = parseInt($('#recurrence').val());
    if (!person || !type || !date) return alert('Fill chore details');
  
    chores.push({ person, type, date, repeat });
    localStorage.setItem('chores', JSON.stringify(chores));
    updateChoreList();
  }
  
  function updateChoreList() {
    let html = '';
    chores.forEach(c => {
      html += `<li class='list-group-item'>${c.person} will ${c.type} on ${c.date}${c.repeat ? ` (repeats every ${c.repeat} days)` : ''}</li>`;
    });
    $('#choreList').html(html);
  }
  
  function updateHistory() {
    let html = '';
    deletedItems.forEach(item => {
      html += `<li class='list-group-item'>${item.payer} ${item.type} of ₹${item.amount} on ${item.date} for "${item.reason}" — Deleted by ${item.deletedBy} (${item.deletedReason}) @ ${item.deletedAt}</li>`;
    });
    $('#historyList').html(html);
  }
  
  function downloadCSV() {
    let csv = 'Payer,Amount,Reason,Type,Date\n';
    entries.forEach(e => {
      csv += `${e.payer},${e.amount},${e.reason},${e.type},${e.date}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roommate_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function sendReminders() {
    Object.keys(users).forEach(u => {
      const phone = users[u].phone;
      const message = encodeURIComponent(`Hey ${u}, please update your expenses and chores on Roommate Manager.`);
      window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
    });
  }
  
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.querySelectorAll('.card, .container, .modal-content, .table').forEach(el => el.classList.toggle('dark-mode'));
    document.querySelectorAll('.list-group-item').forEach(el => {
      el.classList.toggle('bg-dark');
      el.classList.toggle('text-white');
    });
  }