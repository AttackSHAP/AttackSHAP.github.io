window.HELP_IMPROVE_VIDEOJS = false;

document.addEventListener('DOMContentLoaded', function () {
  window.__amessAnchorScript = true;
  var burger = document.querySelector('.navbar-burger');
  var menu = document.getElementById('navbarMain');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('is-active');
      menu.classList.toggle('is-active');
      burger.setAttribute('aria-expanded', String(menu.classList.contains('is-active')));
    });
  }

  function scrollToHash(hash, smooth) {
    var target = document.querySelector(hash);
    var navbar = document.querySelector('.navbar');
    if (!target || !navbar) return;

    var navHeight = navbar.getBoundingClientRect().height;
    var targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: targetTop - navHeight - 16, behavior: smooth ? 'smooth' : 'auto' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      history.pushState(null, '', hash);
      scrollToHash(hash, true);

      if (burger && menu && menu.classList.contains('is-active')) {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (window.location.hash) {
    window.addEventListener('load', function () {
      [0, 150, 400].forEach(function (delay) {
        window.setTimeout(function () {
          scrollToHash(window.location.hash, false);
        }, delay);
      });
    });
  }

  function formatFixed(value, digits) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
    return Number(value).toFixed(digits);
  }

  function subsetMarkup(subset) {
    if (!Array.isArray(subset) || subset.length === 0) {
      return '<span class="subset-muted">Mean over all size-k subsets</span>';
    }

    return subset.map(function (attackId) {
      return '<span class="subset-chip">A' + attackId + '</span>';
    }).join('');
  }

  function utilityMarkup(value, oracleUtility) {
    var width = 0;
    if (oracleUtility > 0) {
      width = Math.max(0, Math.min(100, (Number(value) / Number(oracleUtility)) * 100));
    }
    return '<span class="utility-value">' + formatFixed(value, 4) + '</span>' +
      '<span class="utility-track"><span class="utility-fill" style="width:' + width.toFixed(2) + '%"></span></span>';
  }

  function initSelectionPlayground() {
    var data = window.SELECTION_PLAYGROUND_DATA;
    var indexInput = document.getElementById('dataset-index-input');
    var indexSlider = document.getElementById('dataset-index-slider');
    var rowsEl = document.getElementById('playground-rows');
    var landscapeEl = document.getElementById('playground-landscape');
    var bestEl = document.getElementById('playground-best-method');
    var oracleEl = document.getElementById('playground-oracle');
    var budgetButtons = document.querySelectorAll('.budget-button');

    if (!data || !indexInput || !indexSlider || !rowsEl) return;

    var state = {
      index: 0,
      budget: '4'
    };
    var maxIndex = data.tasks.length - 1;
    indexInput.max = String(maxIndex);
    indexSlider.max = String(maxIndex);

    function clampIndex(value) {
      var parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) return state.index;
      return Math.max(0, Math.min(maxIndex, parsed));
    }

    function render() {
      var task = data.tasks[state.index];
      var budget = task.budgets[state.budget];
      var rows = budget.rows;
      var practical = rows.filter(function (row) {
        return row.method !== 'OracleSearch' && row.method !== 'Random mean';
      });
      var bestUtility = practical.reduce(function (current, row) {
        return Math.max(current, Number(row.utility));
      }, Number.NEGATIVE_INFINITY);
      var bestRows = practical.filter(function (row) {
        return Math.abs(Number(row.utility) - bestUtility) < 1e-9;
      });
      var displayBest = bestRows.length ? bestRows[bestRows.length - 1] : null;

      indexInput.value = String(state.index);
      indexSlider.value = String(state.index);
      landscapeEl.textContent = 'Dataset ' + task.index;
      bestEl.textContent = displayBest ? displayBest.method : 'n/a';
      oracleEl.textContent = formatFixed(budget.oracleUtility, 4);

      budgetButtons.forEach(function (button) {
        button.classList.toggle('is-active', button.dataset.budget === state.budget);
      });

      rowsEl.innerHTML = rows.map(function (row) {
        var classes = [];
        if (bestRows.some(function (bestRow) { return bestRow.method === row.method; })) classes.push('is-best-practical');
        if (row.method === 'OracleSearch') classes.push('is-oracle');
        var note = row.note ? '<span class="method-note">' + row.note + '</span>' : '';
        return '<tr class="' + classes.join(' ') + '">' +
          '<td><span class="method-name">' + row.method + '</span>' + note + '</td>' +
          '<td>' + subsetMarkup(row.subset) + '</td>' +
          '<td class="utility-cell">' + utilityMarkup(row.utility, budget.oracleUtility) + '</td>' +
          '<td><span class="gain-value">' + formatFixed(row.normalizedGain, 3) + '</span></td>' +
          '</tr>';
      }).join('');
    }

    indexInput.addEventListener('input', function () {
      state.index = clampIndex(indexInput.value);
      render();
    });

    indexSlider.addEventListener('input', function () {
      state.index = clampIndex(indexSlider.value);
      render();
    });

    budgetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        state.budget = button.dataset.budget;
        render();
      });
    });

    render();
  }

  initSelectionPlayground();

  if (window.bulmaCarousel) {
    window.bulmaCarousel.attach('.carousel', {
      slidesToScroll: 1,
      slidesToShow: 1,
      loop: true,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 5500
    });
  }

  if (window.bulmaSlider) {
    window.bulmaSlider.attach();
  }
});
