@extends('layouts.dashboard')

@section('page_title')
    Галереи
@endsection

@section('content_title')
    Список галерей
@endsection()

@section('content')
    <div>Галлерея: {{ $gallery->title }}</div>
    <br>
    @include('errors.list')
    <form class="" action="{{ route('update_gallery', $gallery->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Имя в системе (КОРОТКОЕ)</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name"
                           value="{{ old('name', $gallery->name) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title"
                           value="{{ old('title', $gallery->title) }}">
                </div>
            </div>
        </div>
        <br>
        <p>
            <input class="btn btn-danger btn-square" type="submit" value="Отредактировать галлерею">
            <a class="btn btn-primary btn-square" href="{{ route('create_gallery') }}">Создать галлерею</a>
            <a class="btn btn-default btn-square" href="{{ route('gallery') }}">Все галлереи (уйти не сохранив)</a>
        </p>
    </form>
@endsection