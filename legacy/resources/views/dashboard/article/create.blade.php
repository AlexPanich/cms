@extends('layouts.dashboard')


@section('page_title')
    Статьи
@endsection

@section('content_title')
    Создание новой статьи
@endsection

@include('dashboard.editor')

@section('content')
    @include('errors.list')
    <form action="{{ route('add_article') }}" method="post" enctype="multipart/form-data">
        {{ csrf_field() }}
        <div class="form-group">
            <label class="form-label" for="title">Название</label>
            <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
        </div>
        <div class="form-group">
            <label class="form-label" for="preview">Первью (картинка)</label>
            <input class="form-control" type="file" name="preview" id="preview" value="{{ old('preview') }}">
        </div>
        <div class="form-group">
            <label class="from-label" for="text">Текст</label>
            <textarea class="form-control" name="text" id="text" rows="10">{{ old('text') }}</textarea>
        </div>
        <p>
            <input type="submit" value="Создать статью" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_pages') }}">Все страницы (уйти не сохранив)</a>
        </p>
    </form>
@endsection
