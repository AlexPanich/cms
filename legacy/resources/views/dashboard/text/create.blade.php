@extends('layouts.dashboard')

@section('page_title')
    Тексты
@endsection

@section('content_title')
    Создание нового текста
@endsection()

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_text') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="alias">Алиас</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="alias" name="alias" id="alias" value="{{ old('alias') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="body">Текст</label>
            <div class="controls">
                <textarea class="form-control" name="body" id="body" rows="10">{{ old('body') }}</textarea>
            </div>
        </div>
        <div class="control-group">
            <label class="css-input switch switch-sm switch-primary">
                <input type="checkbox" name="is_show" {{ count($errors) == 0 || old('is_show') ? 'checked' : '' }}>
                <span></span>
                Отображать на сайте
            </label>
        </div>
        <br>
        <p>
            <input type="submit" value="Создать текст" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_texts') }}">Все тексты (уйти не сохранив)</a>
        </p>
    </form>
@endsection