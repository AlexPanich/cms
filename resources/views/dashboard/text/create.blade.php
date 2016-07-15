@extends('layouts.dashboard')

@section('title')
    Создание нового текста
@endsection

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
            <label class="control-label" for="content">Текст</label>
            <div class="controls">
                <textarea class="form-control" name="content" id="content"  rows="10">{{ old('content') }}</textarea>
            </div>
        </div>
        <br>
        <input type="submit" value="Создать текст" class="btn btn-danger">
    </form>
@endsection