@extends('layouts.dashboard')

@section('title')
    Редактирование галлереи
@endsection

@section('style')
    <style>
        ul.gallery {
            list-style: none;
            margin: 0;
            padding: 0;
        }
    </style>
@endsection

@section('scripts.footer')
    <script src="{{ URL::to('js/jquery-ui.min.js') }}"></script>
    <script>
        $(document).ready(function() {
            var saved = true;

            $('#btn_save').hide();

            $('#gallery_sortable').sortable({
                sort: function() {
                    $('#msg_save').hide();
                    $('#btn_save').fadeIn(500);
                    saved = false;
                }
            });

            $('#btn_save').on('click', function() {
                var images = [];

                $('#gallery_sortable li').each(function () {
                    images.push($(this).attr('id_image'))
                });

                $.post('{{ route('sorting_image_gallery', $gallery->id) }}', {
                    images: images,
                    _token: '{{ csrf_token() }}',
                },  function(data) {
                        $('#msg_save').fadeIn();
                        $('#btn_save').hide();
                        saved = true;
                    });
            });

            $('a').on('click', function(e) {
                if (!saved && !confirm('Сортировка изображений не сохранена, продолжить?')) {
                    e.preventDefault();
                }
            });
        });
    </script>
@endsection

@section('content')
    <h2>Галлерея: {{ $gallery->title }}</h2>
    <a class="btn btn-primary btn-lg" href="{{ route('upload_gallery', $gallery->id) }}">Загрузить изображения в галлерею</a>
    <br>
    <br>
    <div>
        <button class="btn btn-danger" id="btn_save">Сохранить</button>
        <span class="btn btn-success" id="msg_save">Saved!</span>
    </div>
    <br>
    <ul class="gallery" id="gallery_sortable">
    @foreach($gallery->withImage() as $image)
        <li class="col-xs-6 col-md-3" id_image="{{ $image->id }}">
            <form action="{{ route('delete_image_gallery', $image->id) }}" method="post">
                {{ csrf_field() }}
                <button type="submit">&times;</button>
            </form>
            <a class="thumbnail" href="{{ asset($image->path) }}"><img src="{{ asset($image->thumbnail_path) }}" alt=""></a>
        </li>
    @endforeach
    </ul>
@endsection