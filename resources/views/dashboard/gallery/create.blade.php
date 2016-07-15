@extends('layouts.dashboard')

@section('title')
    Добавление галлереи
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_gallery') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Имя в системе (КОРОТКОЕ)</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name') }}">
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
        <br>
        <input type="submit" value="Создать галлерею" class="btn btn-danger">
    </form>
@endsection