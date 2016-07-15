@extends('layouts.dashboard')

@section('title')
    Наполнение галлереи: {{ $gallery->title }}
@endsection

@section('scripts.footer')
    <script src="{{ URL::to('js/dropzone.js') }}"></script>
    <script>
        Dropzone.options.addImage = {
            paramName: 'image',
            maxFilesize: 2,
            acceptedFiles: '.jpg, .jpeg, .png, .gif',
            autoProcessQueue: false,
            addRemoveLinks: true,
            parallelUploads: 2,
            dictDefaultMessage: 'Перетащите сюда изображения',
            init: function () {
                var submitBtn = document.querySelector('button.upload');
                var deleteBtn = document.querySelector('button.delete');
                var that = this;
                submitBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    that.processQueue();
                });
                deleteBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    that.removeAllFiles();
                });
            },
            complete: function (file) {
                this.removeFile(file);
            },
            success: function() {
                if(this.getQueuedFiles().length) {
                    this.processQueue();
                }
            }
        }


    </script>
@endsection

@section('style')
    <link rel="stylesheet" href="{{ URL::to('css/dropzone.css') }}">
@endsection

@section('content')
    <h2>Загрузка изображения в галлерею: <a href="{{ route('edit_gallery', $gallery->id) }}">{{ $gallery->title }}</a></h2>

    <form action="{{ route('upload_image_gallery', $gallery->id) }}"
          method="post" class="dropzone" enctype="multipart/form-data" id="addImage">
        {{ csrf_field() }}
    </form>
    <br>
    <div>
        <div id="upload-button">
            <span>0 files</span>
            <button type="button" class="upload btn btn-success">Загрузить</button>
            <button type="button" class="delete btn btn-danger">Удалить все</button>
        </div>
    </div>
@endsection