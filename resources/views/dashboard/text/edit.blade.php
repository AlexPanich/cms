@extends('layouts.dashboard')

@section('title')
    Редактирование текста
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('update_text', $text->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="alias">Алиас</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="alias" name="alias" id="alias" value="{{ old('alias', $text->alias) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title', $text->title) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="content">Текст</label>
            <div class="controls">
                <textarea class="form-control" name="content" id="content"  rows="10">{{ old('content', $text->content) }}</textarea>
            </div>
        </div>
        <br>
        <input type="submit" value="Создать текст" class="btn btn-danger">
    </form>
@endsection