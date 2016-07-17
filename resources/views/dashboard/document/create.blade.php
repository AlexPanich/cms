@extends('layouts.dashboard')

@section('page_title')
    Документы
@endsection

@section('content_title')
    Добавление документа
@endsection

@section('scripts.footer')
    <script>
        var token = '{{ csrf_token() }}';
    </script>

    <script src="{{ asset('js/fileuploader.js') }}"></script>
    <script src="{{ asset('js/onload.js') }}"></script>
@endsection

@section('content')
    @include('errors.list')
    <form action="{{ route('add_document') }}" method="post" id="fileloaded">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Title</label>
            <div class="controls">
                <div class="input-prepend">
                    <input name="title" id="title" type="text" class="input-xxlarge" value="{{ old('title') }}"/>
                </div>
            </div>
        </div>
        <br/>
        <div id="message">Выберите файл:</div>
        <table>
            <td><input type="file" id="files" name="files[]"></td>
            <td>(Поддерживаемые форматы: 'pdf')</td>
        </table>
        <br>
        <p>
            <input type="submit" value="Добавить документ" class="btn btn-primary btn-square" id="btnSubmit" value="Add">
            <a class="btn btn-default btn-square" href="{{ route('all_documents') }}">Все документы (уйти не сохранив)</a>
        </p>
    </form>

    <div class="modal fade" id="modal-popin" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-popin">
            <div class="modal-content">
                <div class="block block-themed block-transparent remove-margin-b">
                    <div class="block-header bg-primary-dark">
                        <ul class="block-options">
                            <li>
                                <button data-dismiss="modal" type="button"><i class="si si-close"></i></button>
                            </li>
                        </ul>
                        <h3 class="block-title">Файл загружается</h3>
                    </div>
                    <div class="block-content">
                        <div class="progress">
                            <div class="progress-bar progress-bar-info" id="cnuploader_progressbar" style="width: 0%; transition: none">0%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection