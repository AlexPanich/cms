@extends('layouts.dashboard')

@section('page_title')
    Галереи
@endsection

@section('content_title')
    Сортировка галлереи
@endsection()

@section('scripts.footer')
    <!-- Page JS Plugins -->
    <script src="{{ asset('/assets/js/plugins/magnific-popup/magnific-popup.min.js') }}"></script>

    <!-- Page JS Code -->
    <script>
        jQuery(function () {
            // Init page helpers (Magnific Popup plugin)
            App.initHelpers('magnific-popup');
        });
    </script>
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

                $('#gallery_sortable .sorting_image').each(function () {
                    images.push($(this).attr('id_image'))
                });

                console.log(images);

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
    <div>Галлерея: {{ $gallery->title }}</div>
    <br>
    <div>
        <button class="btn btn-danger btn-square" id="btn_save">Сохранить порядок</button>
        <span class="btn btn-success btn-square" style="cursor: default" id="msg_save">Сохранено</span>
    </div>
    <br>
    <!-- Gallery (.js-gallery class is initialized in App() -> uiHelperMagnific()) -->
    <!-- For more info and examples you can check out http://dimsemenov.com/plugins/magnific-popup/ -->
    <div class="row items-push js-gallery gallery" id="gallery_sortable">
        @foreach($gallery->withImage() as $image)
            <div class="col-sm-6 col-md-4 col-lg-3 animated fadeIn sorting_image"  id_image="{{ $image->id }}" style="cursor: pointer">
                <div class="img-container">
                    <img class="img-responsive" src="{{ asset($image->thumbnail_path) }}" alt="">
                    <div class="img-options">
                        <div class="img-options-content">
                            <h3 class="font-w400 text-white push-5">{{ $image->title }}</h3>
                            <h4 class="h6 font-w400 text-white-op push-15">{{ $image->alt }}</h4>
                            <form action="{{ route('delete_image_gallery', $image->id) }}" method="post">
                            <a class="btn btn-sm btn-default img-lightbox" href="{{ asset($image->path) }}">
                                <i class="fa fa-search-plus"></i> View
                            </a>
                            <div class="btn-group btn-group-sm">
                                <a class="btn btn-default" href="javascript:void(0)"><i class="fa fa-pencil"></i> Edit</a>
                                    {{ csrf_field() }}
                                    <button type="submit" class="btn btn-default" ><i class="fa fa-times"></i> Delete</button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        @endforeach
    </div>
    <!-- END Gallery -->
    <br>
    <p>
        <a class="btn btn-primary btn-square" href="{{ route('upload_gallery', $gallery->id) }}">Загрузить изображения в галлерею</a>
        <a class="btn btn-default btn-square" href="{{ route('gallery') }}">Все галлереи (уйти не сохранив)</a>
    </p>
@endsection