@extends('layouts.dashboard')

@section('page_title')
    Документы
@endsection

@section('content_title')
    Редактирование документа
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('update_text', $document->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title', $document->title) }}">
                </div>
            </div>
        </div>
        <p>
            <input type="submit" value="Сохранить изменения" class="btn btn-primary btn-square" id="btnSubmit" value="Add">
            <a class="btn btn-default btn-square" href="{{ route('all_documents') }}">Все документы (уйти не сохранив)</a>
        </p>
    </form>
@endsection