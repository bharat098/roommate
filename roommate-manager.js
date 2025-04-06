// roommate-manager.js

let users = {
    'Bharat': '1234',
    'Soumya': '2345',
    'Debasis': '3456'
  };
  
  let phones = {
    'Bharat': '8917361050',
    'Soumya': '8984765656',
    'Debasis': '7978403827'
  };
  
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  let chores = JSON.parse(localStorage.getItem('chores')) || [];
  let history = JSON.parse(localStorage.getItem('history')) || [];
  let currentUser = '';
  
  $(document).ready(() => {
    $('#loginModal').modal('show');
    refreshUserDropdowns();
    $('#expenseTable').DataTable();
    updateTable();
    updateSummary();
    updateChart();
    updateChoreList();
    updateHistoryList();
  });
  
  function refreshUserDropdowns() {
    const selects = ['#payer', '#chorePerson', '#resetUser', '#userSelect'];
    selects.forEach(sel => {
      $(sel).html(Object.keys(users).map(u => `<option>${u}</option>`));
    });
  }
  
  function loginUser() {
    const user = $('#userSelect').val();
    const pin = $('#userPin').val();
    const newUser = $('#newRoommate').val();
    const phone = $('#newPhone').val();
    const newPin = $('#userPinNew').val();
  
    if (newUser && newPin) {
      if (!users[newUser]) {
        users[newUser] = newPin;
        phones[newUser] = phone;
        currentUser = newUser;
        refreshUserDropdowns();
      }
    } else if (users[user] === pin) {
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
    updateHistoryList();
  }
  
  function logoutUser() {
    currentUser = '';
    $('#loginModal').modal('show');
  }
  
  function resetPin() {
    if (currentUser !== 'Bharat') return;
    const user = $('#resetUser').val();
    const newPin = $('#newPin').val();
    users[user] = newPin;
    alert(`PIN reset for ${user}`);
  }
  
  function addEntry() {
    const payer = $('#payer').val();
    let amount = parseFloat($('#amount').val());
    const reason = $('#reason').val();
    const type = $('#entryType').val();
    const date = $('#entryDate').val();
    const split = $('#splitAmount').is(':checked');
  
    if (!payer || !amount || !reason || !type || !date) return alert('Fill all fields');
  
    if (split && type === 'expense') {
      const perPerson = amount / Object.keys(users).length;
      Object.keys(users).forEach(user => {
        entries.push({ payer: user, amount: perPerson, reason, type, date });
      });
    } else {
      entries.push({ payer, amount, reason, type, date });
    }
  
    localStorage.setItem('entries', JSON.stringify(entries));
    updateTable();
    updateSummary();
    updateChart();
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
  
  function deleteEntry(index) {
    const reason = prompt('Why do you want to delete this record?');
    if (reason) {
      const removed = entries.splice(index, 1)[0];
      removed.deletionReason = reason;
      removed.deletedBy = currentUser;
      removed.deletedAt = new Date().toISOString();
      history.push(removed);
  
      localStorage.setItem('entries', JSON.stringify(entries));
      localStorage.setItem('history', JSON.stringify(history));
      updateTable();
      updateSummary();
      updateChart();
      updateHistoryList();
    }
  }
  
  function updateHistoryList() {
    const list = $('#historyList');
    list.html('');
    history.forEach(h => {
      list.append(`<li class='list-group-item'>${h.payer} - ${h.amount} - ${h.reason} (${h.type}) on ${h.date}<br><strong>Deleted by:</strong> ${h.deletedBy} at ${new Date(h.deletedAt).toLocaleString()}<br><strong>Reason:</strong> ${h.deletionReason}</li>`);
    });
  }
  
  function updateSummary() {
    const summary = {};
    Object.keys(users).forEach(u => summary[u] = 0);
  
    entries.forEach(e => {
      summary[e.payer] += e.type === 'expense' ? -e.amount : e.amount;
    });
  
    let html = '<ul class="list-group">';
    for (let user in summary) {
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">${user} <span>${summary[user].toFixed(2)}</span> <a target="_blank" href="https://wa.me/91${phones[user] || ''}?text=Hi ${user}, your balance is ${summary[user].toFixed(2)}" class="btn btn-sm btn-success">💬</a></li>`;
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
      data[e.payer] = (data[e.payer] || 0) + (e.type === 'expense' ? -e.amount : e.amount);
    });
  
    if (window.expenseChart) window.expenseChart.destroy();
  
    window.expenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Net Contribution',
          data: Object.values(data),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ]
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
    const list = $('#choreList');
    list.html('');
    chores.forEach(c => {
      list.append(`<li class='list-group-item'>${c.person} will ${c.type} on ${c.date}${c.repeat ? ` (repeats every ${c.repeat} days)` : ''}</li>`);
    });
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
    alert('Reminder sent to all roommates! (mock)');
  }
  
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.querySelectorAll('.card, .container, .modal-content, .table').forEach(el => el.classList.toggle('dark-mode'));
    document.querySelectorAll('.list-group-item').forEach(el => {
      el.classList.toggle('bg-dark');
      el.classList.toggle('text-white');
    });
  }