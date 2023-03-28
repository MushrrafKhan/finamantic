$(document).ready(function () {
    $('.summernote').length && $('.summernote').summernote({
        height: 250,
        minHeight: null,
        maxHeight: null,
        focus: !1,
        toolbar: [
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['insert', ['link', 'hr']],
            ['misc', ['undo', 'redo', 'fullscreen', 'codeview']]
        ]
    });

    $('#range-datepicker').flatpickr({
        mode: 'range',
        maxDate: new Date(),
    });
    
    function formatState (opt) {
        if (!opt.id) {
            return opt.text.toUpperCase();
        }

        const optImage = $(opt.element).attr('data-image');
        if(!optImage){
            return opt.text.toUpperCase();
        }
        return $(
            `<span><img src="${optImage}" width="30px" />${opt.text.toUpperCase()}</span>`
        );
    }

    if ($('.select2').length) {
        $('.select2').select2({
            templateResult: formatState,
            templateSelection: formatState
        });
        $('.select2').on('change', (e) => {
            if (e.target.value) {
                $('.select2').siblings('.text-danger').css('display', 'none');
            }else{
                $('.select2').siblings('.text-danger').css('display', 'block');
            }
        });
    }

    if ($('.select2-multiple').length) {
        $('.select2-multiple').select2({
            templateResult: formatState,
            templateSelection: formatState
        });
        $('.select2-multiple').on('change', (e) => {
            if (e.target.value) {
                $('.select2-multiple').siblings('.text-danger').css('display', 'none');
            }else{
                $('.select2-multiple').siblings('.text-danger').css('display', 'block');
            }
        });
    }

    $('#fromDate').flatpickr({
        minDate: new Date(),
    });

    $('#fromDate').on('change', () => {
        if ($('#toDate').length) {
            $('#toDate').removeAttr('readonly').val('');
            $('#toDate').flatpickr({
                minDate: $('#fromDate').val(),
            });
        }
    });

    $('.niceSelect').niceSelect();
});

$(document).on('click', '.deleteItem, .statusChange', function (e) {
    e.preventDefault();
    const url = $(this).attr('href');
    Swal.fire({
        title: 'Are you sure?',
        type: 'warning',
        showCancelButton: !0,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then(function (t) {
        t.value &&  (window.location.href = url);
    });
});

$('input.form-control').change(function() {
    $(this).val($(this).val().trim());
});